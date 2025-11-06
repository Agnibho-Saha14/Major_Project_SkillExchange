const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

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
 * Verify skill title appears in certificate
 * At least one significant word from the title must be present
 */
function verifySkillTitle(extractedText, skillTitle) {
  if (!extractedText || !skillTitle) return { success: false, matchedWords: [] };

  // Normalize extracted text
  const normalizedText = extractedText
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ');

  // Extract meaningful words from title (ignore common words)
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  const titleWords = skillTitle
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.replace(/[^\w]/g, ''))
    .filter(w => w.length >= 3 && !commonWords.includes(w));

  console.log('\n=== Title Verification ===');
  console.log('Skill Title:', skillTitle);
  console.log('Extracted meaningful words:', titleWords);

  if (titleWords.length === 0) {
    console.log('⚠️  No meaningful words found in title');
    return { success: false, matchedWords: [] };
  }

  const matchedWords = [];

  // Check each word with fuzzy matching
  for (const word of titleWords) {
    // Direct match
    if (normalizedText.includes(word)) {
      matchedWords.push(word);
      console.log(`✓ Direct match found: "${word}"`);
      continue;
    }

    // Fuzzy match with common variations
    const variations = [
      word,
      word.replace(/s$/, ''), // Remove plural
      word + 's', // Add plural
      word.replace(/ing$/, ''), // Remove -ing
      word.replace(/ed$/, ''), // Remove -ed
    ];

    let found = false;
    for (const variant of variations) {
      if (normalizedText.includes(variant)) {
        matchedWords.push(word);
        console.log(`✓ Variant match found: "${word}" → "${variant}"`);
        found = true;
        break;
      }
    }

    // Check for partial fuzzy matches in the text
    if (!found && word.length >= 5) {
      const words = normalizedText.split(' ');
      for (const textWord of words) {
        if (textWord.length >= 4) {
          const similarity = calculateSimilarity(word, textWord);
          if (similarity >= 0.8) {
            matchedWords.push(word);
            console.log(`✓ Fuzzy match found: "${word}" ≈ "${textWord}" (${(similarity * 100).toFixed(1)}%)`);
            found = true;
            break;
          }
        }
      }
    }
  }

  const success = matchedWords.length > 0;
  
  if (success) {
    console.log(`✅ Title verification passed! Matched ${matchedWords.length}/${titleWords.length} words`);
  } else {
    console.log('❌ Title verification failed - no words from title found in certificate');
  }

  return { success, matchedWords, totalWords: titleWords.length };
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
 * Main verification function - checks both credential ID and skill title
 */
async function verifyCertificateCredential(certificatePath, credentialId, skillTitle) {
  try {
    console.log('\n🔍 Starting OCR Certificate Verification');
    console.log('Certificate:', certificatePath);
    console.log('Credential ID:', credentialId);
    console.log('Skill Title:', skillTitle);

    const extractedText = await extractTextFromImage(certificatePath);
    
    // Verify credential ID
    const credentialValid = verifyCredentialId(extractedText, credentialId);
    
    // Verify skill title
    const titleVerification = verifySkillTitle(extractedText, skillTitle);

    const allValid = credentialValid && titleVerification.success;

    let message = '';
    if (!credentialValid && !titleVerification.success) {
      message = '❌ Both credential ID and skill title verification failed. Please ensure:\n' +
                '1. The credential ID matches exactly what appears on the certificate\n' +
                '2. At least one word from your skill title appears in the certificate';
    } else if (!credentialValid) {
      message = '❌ Credential ID not found in certificate. Please verify the credential ID matches exactly.';
    } else if (!titleVerification.success) {
      message = `❌ Skill title verification failed. None of the meaningful words from "${skillTitle}" were found in the certificate. ` +
                'Please ensure your skill title relates to the certificate content.';
    } else {
      message = `✅ Certificate verified successfully! Credential ID found and ${titleVerification.matchedWords.length} word(s) from title matched.`;
    }

    return {
      success: allValid,
      credentialValid,
      titleValid: titleVerification.success,
      matchedWords: titleVerification.matchedWords,
      totalTitleWords: titleVerification.totalWords,
      extractedText: extractedText.substring(0, 1500),
      message
    };
  } catch (error) {
    console.error('Verification error:', error);
    return {
      success: false,
      credentialValid: false,
      titleValid: false,
      message: 'Failed to verify certificate. Please ensure the image is clear and readable.',
      error: error.message
    };
  }
}

module.exports = {
  verifyCertificateCredential,
  extractTextFromImage,
  verifyCredentialId,
  verifySkillTitle
};