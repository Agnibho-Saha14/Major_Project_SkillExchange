const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

//image preprocessing
async function preprocessImage(inputPath, variant = 'default') {
  const outputPath = inputPath.replace(/\.(jpg|jpeg|png)$/i, `_processed_${variant}.png`);

  const processor = sharp(inputPath)
    .resize({ width: 2400, withoutEnlargement: false })
    .extend({ top: 50, bottom: 50, left: 50, right: 50, background: 'white' });

  if (variant === 'high_contrast') {
    await processor
      .greyscale()
      .normalize()
      .linear(1.5, -(128 * 0.5)) 
      .toFile(outputPath);
  } else if (variant === 'inverted') {
    await processor
      .greyscale()
      .negate()
      .normalize()
      .toFile(outputPath);
  } else {
    await processor
      .greyscale()
      .normalize()
      .sharpen({ sigma: 1 })
      .toFile(outputPath);
  }

  return outputPath;
}

/**
 * Perform OCR with multiple PSM modes
 */
async function performOCR(bufferOrPath, psmMode = 6) {
  try {
    const { data: { text } } = await Tesseract.recognize(
      bufferOrPath,
      'eng',
      {
        tessedit_pageseg_mode: psmMode,
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789- ',
        preserve_interword_spaces: 1,
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress (PSM ${psmMode}): ${(m.progress * 100).toFixed(1)}%`);
          }
        }
      }
    );
    return text;
  } catch (error) {
    console.error(`OCR failed for PSM mode ${psmMode}:`, error.message);
    return '';
  }
}

//extracting text
async function extractTextFromImage(imagePath) {
  try {
    const processedPaths = [];
    let allExtractedText = [];

    console.log('\n=== Strategy 1: Default Processing ===');
    const defaultPath = await preprocessImage(imagePath, 'default');
    processedPaths.push(defaultPath);

    const image = sharp(defaultPath);
    const metadata = await image.metadata();
    console.log('Image dimensions:', metadata.width, 'x', metadata.height);

    // Full image OCR with multiple PSM modes
    for (const psm of [6, 3, 11]) {
      console.log(`\nFull image OCR (PSM ${psm})...`);
      const text = await performOCR(defaultPath, psm);
      if (text.trim()) allExtractedText.push(text);
    }

    // === Strategy 2: All four corners ===
    console.log('\n=== Strategy 2: Corner Extraction (All 4 Corners) ===');
    const cornerWidth = Math.floor(metadata.width * 0.45);
    const cornerHeight = Math.floor(metadata.height * 0.25);

    const corners = {
      topLeft: { left: 0, top: 0 },
      topRight: { left: metadata.width - cornerWidth, top: 0 },
      bottomLeft: { left: 0, top: metadata.height - cornerHeight },
      bottomRight: { left: metadata.width - cornerWidth, top: metadata.height - cornerHeight }
    };

    for (const [name, region] of Object.entries(corners)) {
      console.log(`Extracting from ${name} corner...`);
      const buffer = await sharp(defaultPath)
        .extract({
          left: region.left,
          top: region.top,
          width: cornerWidth,
          height: cornerHeight
        })
        .resize({ width: 1200 })
        .toBuffer();

      const text = await performOCR(buffer, 6);
      if (text.trim()) allExtractedText.push(text);
    }

    // === Strategy 3: High contrast full ===
    console.log('\n=== Strategy 3: High Contrast Processing ===');
    const contrastPath = await preprocessImage(imagePath, 'high_contrast');
    processedPaths.push(contrastPath);

    const contrastText = await performOCR(contrastPath, 6);
    if (contrastText.trim()) allExtractedText.push(contrastText);

    // === Strategy 4: All 4 corners (high contrast) ===
    console.log('\n=== Strategy 4: High Contrast Corner Extraction ===');
    for (const [name, region] of Object.entries(corners)) {
      console.log(`Extracting from ${name} corner (high contrast)...`);
      const buffer = await sharp(contrastPath)
        .extract({
          left: region.left,
          top: region.top,
          width: cornerWidth,
          height: cornerHeight
        })
        .resize({ width: 1200 })
        .toBuffer();

      const text = await performOCR(buffer, 11);
      if (text.trim()) allExtractedText.push(text);
    }

    // Cleanup
    for (const p of processedPaths) {
      await fs.unlink(p).catch(() => {});
    }

    const combinedText = allExtractedText.join('\n\n');
    console.log('\n=== Combined Extracted Text ===');
    console.log('Total characters extracted:', combinedText.length);
    console.log('Preview:', combinedText.substring(0, 500));

    return combinedText;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to extract text from certificate');
  }
}

/**
 * Use Gemini AI to verify if skill title matches certificate content
 * Also checks for inappropriate content in skill title
 */
async function verifySkillTitleWithGemini(extractedText, skillTitle) {
  try {
    console.log('\n=== Gemini AI Title Verification ===');
    console.log('Skill Title:', skillTitle);
    console.log('Certificate Text Length:', extractedText.length);

    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not found in environment variables');
      return {
        success: false,
        isRelevant: false,
        isAppropriate: false,
        confidence: 0,
        reason: 'Gemini API key not configured',
        certificateTitle: '',
        aiAnalysis: 'API key missing'
      };
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an expert education certificate validator. Analyze if the submitted skill title matches the certificate content.

**Certificate Text (extracted via OCR):**
${extractedText.substring(0, 3000)}

**Submitted Skill Title:**
"${skillTitle}"

Please perform TWO analyses:

**ANALYSIS 1 - Content Appropriateness:**
Check if the skill title contains any inappropriate, abusive, offensive, or unprofessional language. This includes profanity, hate speech, discriminatory terms, or any content that would be unsuitable for an educational platform.

**ANALYSIS 2 - Certificate Relevance:**
Determine if the skill title is relevant to what the certificate teaches. Consider:
1. Is the skill title the SAME course as the certificate? (e.g., "Web Development" matches "Web Development Certificate")
2. Is the skill title a SUBSET or specialization of the certificate? (e.g., "React Development" is a subset of "Full Stack Development Certificate")
3. Is the skill title a SUPERSET that includes the certificate content? (e.g., "Full Stack Development" includes "React Basics Certificate")
4. Are they related but in the same domain? (e.g., "Data Science" and "Machine Learning" are closely related)
5. Completely UNRELATED topics should NOT match (e.g., "Cooking" and "Web Development")

**Respond in EXACTLY this JSON format (no additional text):**
{
  "isAppropriate": true/false,
  "inappropriateReason": "explanation if false, empty string if true",
  "isRelevant": true/false,
  "confidence": 0-100,
  "relationship": "same|subset|superset|related|unrelated",
  "certificateTitle": "extracted certificate title",
  "reason": "brief explanation of match/mismatch"
}

**Important:**
- Set isAppropriate to false if ANY inappropriate content detected
- Set isRelevant to true ONLY if relationship is same/subset/superset/related
- Set isRelevant to false if topics are completely unrelated
- Confidence should be 0-100 (higher = more certain)
- Be strict but fair - legitimate educational variations are acceptable`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini Raw Response:', text);

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.substring(7);
    }
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.substring(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.substring(0, jsonText.length - 3);
    }
    jsonText = jsonText.trim();

    const analysis = JSON.parse(jsonText);

    console.log('\n=== Gemini Analysis Results ===');
    console.log('Appropriate Content:', analysis.isAppropriate);
    console.log('Relevant to Certificate:', analysis.isRelevant);
    console.log('Relationship:', analysis.relationship);
    console.log('Confidence:', analysis.confidence + '%');
    console.log('Certificate Title:', analysis.certificateTitle);
    console.log('Reason:', analysis.reason);

    if (!analysis.isAppropriate) {
      console.log('⚠️ INAPPROPRIATE CONTENT DETECTED:', analysis.inappropriateReason);
    }

    if (analysis.isRelevant && analysis.isAppropriate) {
      console.log('✅ Title verification PASSED');
    } else {
      console.log('❌ Title verification FAILED');
    }

    return {
      success: analysis.isRelevant && analysis.isAppropriate,
      isRelevant: analysis.isRelevant,
      isAppropriate: analysis.isAppropriate,
      inappropriateReason: analysis.inappropriateReason || '',
      confidence: analysis.confidence,
      relationship: analysis.relationship,
      certificateTitle: analysis.certificateTitle,
      reason: analysis.reason,
      aiAnalysis: text.substring(0, 1000)
    };

  } catch (error) {
    console.error('Gemini AI Error:', error);
    return {
      success: false,
      isRelevant: false,
      isAppropriate: true,
      confidence: 0,
      reason: 'AI analysis failed: ' + error.message,
      certificateTitle: '',
      aiAnalysis: error.message
    };
  }
}

/**
 * Advanced fuzzy verification for credential ID
 */
function verifyCredentialId(extractedText, credentialId) {
  if (!extractedText || !credentialId) return false;

  // Normalize text
  const normalizedText = extractedText
    .replace(/\s+/g, '')
    .replace(/[^\w-]/g, '')
    .toLowerCase();

  const normalizedCredentialId = credentialId
    .replace(/\s+/g, '')
    .replace(/[^\w-]/g, '')
    .toLowerCase();

  console.log('\n=== Credential ID Verification ===');
  console.log('Looking for:', normalizedCredentialId);
  console.log('Search space length:', normalizedText.length);

  // Direct match
  if (normalizedText.includes(normalizedCredentialId)) {
    console.log('✓ Direct match found!');
    return true;
  }

  // Common OCR substitutions
  const ocrVariants = [
    normalizedCredentialId,
    normalizedCredentialId.replace(/0/g, 'o'), 
    normalizedCredentialId.replace(/o/g, '0'), 
    normalizedCredentialId.replace(/1/g, 'i'), 
    normalizedCredentialId.replace(/1/g, 'l'), 
    normalizedCredentialId.replace(/5/g, 's'), 
    normalizedCredentialId.replace(/8/g, 'b'), 
  ];

  for (const variant of ocrVariants) {
    if (normalizedText.includes(variant)) {
      console.log(`✓ OCR variant match found: ${variant}`);
      return true;
    }
  }

  // Sliding window fuzzy match
  const idLength = normalizedCredentialId.length;
  const threshold = 0.85; // 85% similarity required

  for (let i = 0; i <= normalizedText.length - idLength; i++) {
    const window = normalizedText.substring(i, i + idLength);
    const similarity = calculateSimilarity(window, normalizedCredentialId);

    if (similarity >= threshold) {
      console.log(`✓ Fuzzy match found: "${window}" (${(similarity * 100).toFixed(1)}% similar)`);
      return true;
    }
  }

  console.log('✗ No match found');
  return false;
}

//similarity ratio
function calculateSimilarity(str1, str2) {
  const distance = levenshtein(str1, str2);
  const maxLen = Math.max(str1.length, str2.length);
  return 1 - (distance / maxLen);
}

// Levenshtein distance
function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[a.length][b.length];
}

/**
 * Main verification function - checks credential ID and uses Gemini AI for title verification
 */
async function verifyCertificateCredential(certificatePath, credentialId, skillTitle) {
  try {
    console.log('\n🔍 Starting OCR Certificate Verification with Gemini AI');
    console.log('Certificate:', certificatePath);
    console.log('Credential ID:', credentialId);
    console.log('Skill Title:', skillTitle);

    const extractedText = await extractTextFromImage(certificatePath);
    
    // Verify credential ID (original logic)
    const credentialValid = verifyCredentialId(extractedText, credentialId);
    
    // Verify skill title with Gemini AI
    const titleVerification = await verifySkillTitleWithGemini(extractedText, skillTitle);

    const allValid = credentialValid && titleVerification.success;

    let message = '';
    if (!titleVerification.isAppropriate) {
      message = `❌ INAPPROPRIATE CONTENT DETECTED in skill title.\n\n` +
                `Reason: ${titleVerification.inappropriateReason}\n\n` +
                `Please provide a professional, appropriate skill title.`;
    } else if (!credentialValid && !titleVerification.isRelevant) {
      message = `❌ Both credential ID and skill title verification failed.\n\n` +
                `**Credential ID:** Not found in certificate\n` +
                `**Skill Title:** ${titleVerification.reason}\n\n` +
                `Certificate appears to be for: "${titleVerification.certificateTitle}"\n` +
                `Your skill title: "${skillTitle}"\n` +
                `Relationship: ${titleVerification.relationship} (${titleVerification.confidence}% confidence)`;
    } else if (!credentialValid) {
      message = `❌ Credential ID not found in certificate.\n\n` +
                `The credential ID "${credentialId}" could not be located in the certificate text. ` +
                `Please verify it matches exactly what appears on your certificate.\n\n` +
                `✓ Skill title is relevant to the certificate`;
    } else if (!titleVerification.isRelevant) {
      message = `❌ Skill title does not match certificate content.\n\n` +
                `**AI Analysis:** ${titleVerification.reason}\n\n` +
                `**Certificate appears to be for:** "${titleVerification.certificateTitle}"\n` +
                `**Your skill title:** "${skillTitle}"\n` +
                `**Relationship:** ${titleVerification.relationship}\n` +
                `**Confidence:** ${titleVerification.confidence}%\n\n` +
                `Please ensure your skill title accurately reflects what the certificate teaches. ` +
                `The skill can be the same course, a subset, or a specialization of the certificate content.\n\n` +
                `✓ Credential ID verified successfully`;
    } else {
      message = `✅ Certificate verified successfully!\n\n` +
                `**Credential ID:** Found and verified\n` +
                `**Skill Title:** Matches certificate content\n` +
                `**Certificate Title:** "${titleVerification.certificateTitle}"\n` +
                `**Relationship:** ${titleVerification.relationship}\n` +
                `**AI Confidence:** ${titleVerification.confidence}%\n\n` +
                `${titleVerification.reason}`;
    }

    return {
      success: allValid,
      credentialValid,
      titleValid: titleVerification.isRelevant,
      isAppropriate: titleVerification.isAppropriate,
      inappropriateReason: titleVerification.inappropriateReason,
      confidence: titleVerification.confidence,
      relationship: titleVerification.relationship,
      certificateTitle: titleVerification.certificateTitle,
      aiReason: titleVerification.reason,
      extractedText: extractedText.substring(0, 1500),
      message
    };
  } catch (error) {
    console.error('Verification error:', error);
    return {
      success: false,
      credentialValid: false,
      titleValid: false,
      isAppropriate: true,
      message: 'Failed to verify certificate. Please ensure the image is clear and readable.',
      error: error.message
    };
  }
}

module.exports = {
  verifyCertificateCredential,
  extractTextFromImage,
  verifyCredentialId,
  verifySkillTitleWithGemini
};