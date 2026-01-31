const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Known credential ID patterns for different platforms
const CREDENTIAL_PATTERNS = {
  'coursera': /^[A-Z0-9]{12,25}$/i,
  'udemy': /^UC-[A-Z0-9-]{20,}$/i,
  'linkedin': /^[A-Z]{2,4}[0-9A-Z]{10,}$/i,
  'edx': /^[a-f0-9]{32}$/i,
  'google': /^[A-Z0-9]{15,30}$/i,
  'microsoft': /^[A-Z0-9-]{20,40}$/i,
  'aws': /^[A-Z0-9-]{20,50}$/i,
  'meta': /^[A-Z0-9]{15,30}$/i,
  'ibm': /^[A-Z0-9]{10,30}$/i,
  'cisco': /^[A-Z0-9]{15,25}$/i,
  'oracle': /^[0-9]{10,15}$/,
  'salesforce': /^[a-zA-Z0-9]{15,20}$/,
  'hubspot': /^[a-f0-9-]{36}$/i, // UUID format
  'comptia': /^[A-Z0-9]{12,20}$/i,
};

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
 * OPTION 1: Visual Certificate Structure Validation using Gemini Vision
 */
async function validateCertificateStructure(imagePath) {
  try {
    console.log('\n=== Visual Certificate Structure Validation ===');
    
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not found');
      return {
        isLegitCertificate: false,
        confidence: 0,
        reason: 'Gemini API key not configured'
      };
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // Read image and convert to base64
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Determine mime type
    const ext = path.extname(imagePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    const mimeType = mimeTypes[ext] || 'image/jpeg';

    const prompt = `You are an expert certificate authentication system. Analyze this image and determine if it is a LEGITIMATE educational certificate or course completion document.

**STRICT REQUIREMENTS for a legitimate certificate:**

1. **Official Layout & Design:**
   - Professional certificate border or frame
   - Official organizational logo/branding
   - Formal typography and layout
   - Not a screenshot, photo of screen, or casual document

2. **Required Text Elements:**
   - Issuing organization name (e.g., Coursera, Udemy, edX, Google, Microsoft, etc.)
   - Certificate title or "Certificate of Completion"
   - Recipient/learner name
   - Course/skill title
   - Completion date or issue date
   - Credential ID or certificate number

3. **Official Markers:**
   - Signatures (digital or scanned)
   - Official seals or stamps
   - Verification URL or QR code (common but not always required)

4. **Red Flags (mark as INVALID if detected):**
   - Screenshot of a webpage
   - Photo of a computer screen
   - Blurry or low-quality image
   - Missing critical elements (no issuer, no date, no credential ID)
   - Hand-written certificates (unless from recognized institution)
   - Generic templates without official branding
   - Social media posts or casual documents
   - Memes, jokes, or obviously fake certificates

**Respond in EXACTLY this JSON format (no additional text):**
{
  "isLegitCertificate": true/false,
  "confidence": 0-100,
  "foundElements": ["list all certificate elements found"],
  "missingElements": ["list critical missing elements"],
  "suspiciousIndicators": ["any red flags or concerns"],
  "issuerOrganization": "detected organization name (e.g., Coursera, Udemy, Google)",
  "certificateType": "type of certificate detected",
  "hasCredentialId": true/false,
  "hasOfficialLogo": true/false,
  "hasSignatures": true/false,
  "imageQuality": "excellent|good|fair|poor",
  "reason": "detailed explanation of why this is or isn't a legitimate certificate"
}

**IMPORTANT:**
- Be STRICT - only mark as legitimate if it clearly looks like an official certificate
- Screenshots, photos of screens, or casual documents should be marked as INVALID
- Missing credential ID is a major red flag
- Missing issuer organization is automatic INVALID
- Confidence below 70 should result in isLegitCertificate: false`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Image
        }
      }
    ]);

    const response = await result.response;
    let text = response.text().trim();
    
    console.log('Gemini Raw Response:', text);

    // Clean JSON from markdown code blocks
    if (text.startsWith('```json')) {
      text = text.substring(7);
    }
    if (text.startsWith('```')) {
      text = text.substring(3);
    }
    if (text.endsWith('```')) {
      text = text.substring(0, text.length - 3);
    }
    text = text.trim();

    const analysis = JSON.parse(text);
    
    console.log('\n=== Visual Analysis Results ===');
    console.log('Is Legitimate Certificate:', analysis.isLegitCertificate);
    console.log('Confidence:', analysis.confidence + '%');
    console.log('Issuer Organization:', analysis.issuerOrganization);
    console.log('Certificate Type:', analysis.certificateType);
    console.log('Has Credential ID:', analysis.hasCredentialId);
    console.log('Has Official Logo:', analysis.hasOfficialLogo);
    console.log('Has Signatures:', analysis.hasSignatures);
    console.log('Image Quality:', analysis.imageQuality);
    console.log('Found Elements:', analysis.foundElements.join(', '));
    console.log('Missing Elements:', analysis.missingElements.join(', '));
    console.log('Suspicious Indicators:', analysis.suspiciousIndicators.join(', '));
    console.log('Reason:', analysis.reason);
    
    if (analysis.isLegitCertificate) {
      console.log('✅ Visual validation PASSED');
    } else {
      console.log('❌ Visual validation FAILED');
    }

    return analysis;

  } catch (error) {
    console.error('Visual validation error:', error);
    return {
      isLegitCertificate: false,
      confidence: 0,
      foundElements: [],
      missingElements: ['Unable to analyze'],
      suspiciousIndicators: ['Analysis failed'],
      issuerOrganization: '',
      reason: 'Failed to validate certificate structure: ' + error.message
    };
  }
}

/**
 * OPTION 3: Enhanced Credential ID Format Validation
 */
function validateCredentialIdFormat(credentialId, issuerOrganization) {
  console.log('\n=== Credential ID Format Validation ===');
  console.log('Credential ID:', credentialId);
  console.log('Issuer Organization:', issuerOrganization);

  if (!credentialId || credentialId.length < 8) {
    console.log('❌ Credential ID too short (minimum 8 characters)');
    return {
      isValid: false,
      reason: 'Credential ID must be at least 8 characters long',
      expectedPattern: 'Minimum 8 characters'
    };
  }

  const issuerLower = issuerOrganization.toLowerCase();
  
  // Check against known patterns
  for (const [platform, pattern] of Object.entries(CREDENTIAL_PATTERNS)) {
    if (issuerLower.includes(platform)) {
      const isValid = pattern.test(credentialId);
      console.log(`Checking against ${platform} pattern:`, pattern.toString());
      console.log('Format Valid:', isValid);
      
      if (!isValid) {
        return {
          isValid: false,
          reason: `Credential ID format does not match ${platform} certificate pattern`,
          expectedPattern: pattern.toString(),
          platform: platform
        };
      }
      
      console.log('✅ Credential ID format valid for', platform);
      return {
        isValid: true,
        reason: `Valid ${platform} credential ID format`,
        expectedPattern: pattern.toString(),
        platform: platform
      };
    }
  }
  
  // If issuer not recognized, apply general validation
  const generalPattern = /^[A-Za-z0-9-]{8,50}$/;
  const isValid = generalPattern.test(credentialId);
  
  console.log('Using general pattern validation:', generalPattern.toString());
  console.log('Format Valid:', isValid);
  
  if (!isValid) {
    return {
      isValid: false,
      reason: 'Credential ID contains invalid characters. Only letters, numbers, and hyphens are allowed.',
      expectedPattern: generalPattern.toString()
    };
  }
  
  console.log('✅ Credential ID format valid (general pattern)');
  return {
    isValid: true,
    reason: 'Valid credential ID format',
    expectedPattern: generalPattern.toString()
  };
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
 * MAIN VERIFICATION FUNCTION - Enhanced with visual validation and format checking
 */
async function verifyCertificateCredential(certificatePath, credentialId, skillTitle) {
  try {
    console.log('\n🔍 Starting Enhanced OCR Certificate Verification with Multi-Layer Security');
    console.log('Certificate:', certificatePath);
    console.log('Credential ID:', credentialId);
    console.log('Skill Title:', skillTitle);

    // ===== LAYER 1: Visual Structure Validation =====
    console.log('\n📸 LAYER 1: Visual Certificate Structure Validation');
    const structureValidation = await validateCertificateStructure(certificatePath);
    
    // Fail fast if not a legitimate certificate
    if (!structureValidation.isLegitCertificate || structureValidation.confidence < 70) {
      return {
        success: false,
        structureValid: false,
        credentialValid: false,
        titleValid: false,
        message: `❌ INVALID CERTIFICATE IMAGE DETECTED\n\n` +
                 `**Reason:** ${structureValidation.reason}\n\n` +
                 `**Issues Found:**\n` +
                 `${structureValidation.missingElements.length > 0 ? '• Missing: ' + structureValidation.missingElements.join(', ') + '\n' : ''}` +
                 `${structureValidation.suspiciousIndicators.length > 0 ? '• Suspicious: ' + structureValidation.suspiciousIndicators.join(', ') + '\n' : ''}` +
                 `\n**Confidence:** ${structureValidation.confidence}%\n\n` +
                 `Please upload a legitimate educational certificate from a recognized institution or platform.`,
        visualAnalysis: structureValidation
      };
    }

    console.log('✅ Visual validation passed - proceeding to text extraction');

    // ===== LAYER 2: Text Extraction via OCR =====
    console.log('\n📝 LAYER 2: OCR Text Extraction');
    const extractedText = await extractTextFromImage(certificatePath);
    
    if (!extractedText || extractedText.length < 50) {
      return {
        success: false,
        structureValid: true,
        credentialValid: false,
        titleValid: false,
        message: `❌ INSUFFICIENT TEXT EXTRACTED\n\n` +
                 `The certificate image appears valid but we couldn't extract enough text from it.\n\n` +
                 `Please ensure:\n` +
                 `• The image is high quality and clear\n` +
                 `• All text is readable and not blurry\n` +
                 `• The certificate is not rotated or skewed`,
        extractedTextLength: extractedText.length
      };
    }

    // ===== LAYER 3: Credential ID Format Validation =====
    console.log('\n🔢 LAYER 3: Credential ID Format Validation');
    const formatValidation = validateCredentialIdFormat(
      credentialId,
      structureValidation.issuerOrganization
    );

    if (!formatValidation.isValid) {
      return {
        success: false,
        structureValid: true,
        formatValid: false,
        credentialValid: false,
        titleValid: false,
        message: `❌ INVALID CREDENTIAL ID FORMAT\n\n` +
                 `**Reason:** ${formatValidation.reason}\n\n` +
                 `**Detected Issuer:** ${structureValidation.issuerOrganization}\n` +
                 `**Expected Pattern:** ${formatValidation.expectedPattern}\n` +
                 `**Your Credential ID:** ${credentialId}\n\n` +
                 `Please verify that you've entered the correct credential ID exactly as it appears on your certificate.`,
        formatValidation: formatValidation,
        issuer: structureValidation.issuerOrganization
      };
    }

    console.log('✅ Credential ID format valid - proceeding to ID verification');

    // ===== LAYER 4: Credential ID Text Matching =====
    console.log('\n🔍 LAYER 4: Credential ID OCR Verification');
    const credentialValid = verifyCredentialId(extractedText, credentialId);
    
    // ===== LAYER 5: AI Title Verification =====
    console.log('\n🤖 LAYER 5: AI-Powered Skill Title Verification');
    const titleVerification = await verifySkillTitleWithGemini(extractedText, skillTitle);

    // ===== FINAL VALIDATION =====
    const allValid = structureValidation.isLegitCertificate &&
                     formatValidation.isValid &&
                     credentialValid &&
                     titleVerification.success;

    // Build detailed response message
    let message = '';
    let failureReasons = [];

    // Check for inappropriate content first
    if (!titleVerification.isAppropriate) {
      return {
        success: false,
        structureValid: true,
        formatValid: true,
        credentialValid: credentialValid,
        titleValid: false,
        isAppropriate: false,
        message: `❌ INAPPROPRIATE CONTENT DETECTED\n\n` +
                 `**Issue:** ${titleVerification.inappropriateReason}\n\n` +
                 `Please provide a professional, appropriate skill title for your certificate.`,
        inappropriateReason: titleVerification.inappropriateReason
      };
    }

    // Build failure reasons if validation failed
    if (!allValid) {
      if (!credentialValid) {
        failureReasons.push(`**Credential ID Mismatch:** The credential ID "${credentialId}" was not found in the certificate text. Please verify it matches exactly what appears on your certificate.`);
      }
      if (!titleVerification.isRelevant) {
        failureReasons.push(
          `**Skill Title Mismatch:** ${titleVerification.reason}\n` +
          `  - Certificate is for: "${titleVerification.certificateTitle}"\n` +
          `  - Your skill title: "${skillTitle}"\n` +
          `  - Relationship: ${titleVerification.relationship}\n` +
          `  - AI Confidence: ${titleVerification.confidence}%`
        );
      }

      message = `❌ CERTIFICATE VERIFICATION FAILED\n\n` +
                `**Visual Validation:** ✅ Passed (${structureValidation.confidence}% confidence)\n` +
                `**Format Validation:** ✅ Passed (${formatValidation.platform || 'general'})\n` +
                `**Credential ID:** ${credentialValid ? '✅ Verified' : '❌ Not Found'}\n` +
                `**Skill Title:** ${titleVerification.isRelevant ? '✅ Matches' : '❌ Mismatch'}\n\n` +
                `**Issues:**\n${failureReasons.join('\n\n')}`;

      return {
        success: false,
        structureValid: true,
        formatValid: true,
        credentialValid: credentialValid,
        titleValid: titleVerification.isRelevant,
        isAppropriate: titleVerification.isAppropriate,
        confidence: titleVerification.confidence,
        relationship: titleVerification.relationship,
        certificateTitle: titleVerification.certificateTitle,
        issuer: structureValidation.issuerOrganization,
        message: message,
        extractedText: extractedText.substring(0, 1500)
      };
    }

    // ===== SUCCESS - All validations passed =====
    message = `✅ CERTIFICATE FULLY VERIFIED!\n\n` +
              `**Visual Validation:** ✅ Legitimate certificate (${structureValidation.confidence}% confidence)\n` +
              `**Issuer:** ${structureValidation.issuerOrganization}\n` +
              `**Certificate Type:** ${structureValidation.certificateType}\n` +
              `**Format Validation:** ✅ Valid ${formatValidation.platform || 'credential ID'} format\n` +
              `**Credential ID:** ✅ Found and verified in certificate\n` +
              `**Skill Title:** ✅ Matches certificate content\n\n` +
              `**Certificate Details:**\n` +
              `• Certificate Title: "${titleVerification.certificateTitle}"\n` +
              `• Your Skill: "${skillTitle}"\n` +
              `• Relationship: ${titleVerification.relationship}\n` +
              `• AI Confidence: ${titleVerification.confidence}%\n\n` +
              `**AI Analysis:** ${titleVerification.reason}`;

    return {
      success: true,
      structureValid: true,
      formatValid: true,
      credentialValid: true,
      titleValid: true,
      isAppropriate: true,
      confidence: titleVerification.confidence,
      relationship: titleVerification.relationship,
      certificateTitle: titleVerification.certificateTitle,
      issuer: structureValidation.issuerOrganization,
      certificateType: structureValidation.certificateType,
      hasCredentialId: structureValidation.hasCredentialId,
      hasOfficialLogo: structureValidation.hasOfficialLogo,
      hasSignatures: structureValidation.hasSignatures,
      imageQuality: structureValidation.imageQuality,
      message: message,
      extractedText: extractedText.substring(0, 1500),
      visualAnalysis: structureValidation,
      formatValidation: formatValidation
    };

  } catch (error) {
    console.error('Verification error:', error);
    return {
      success: false,
      structureValid: false,
      credentialValid: false,
      titleValid: false,
      message: `❌ VERIFICATION ERROR\n\n` +
               `An error occurred while verifying your certificate. Please try again.\n\n` +
               `If the problem persists, ensure:\n` +
               `• Your image is in a supported format (JPG, PNG, GIF, WEBP)\n` +
               `• The file is not corrupted\n` +
               `• The image is clear and readable`,
      error: error.message
    };
  }
}

module.exports = {
  verifyCertificateCredential,
  extractTextFromImage,
  verifyCredentialId,
  verifySkillTitleWithGemini,
  validateCertificateStructure,
  validateCredentialIdFormat
};