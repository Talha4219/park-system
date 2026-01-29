import Tesseract from 'tesseract.js';
import path from 'path';
import sharp from 'sharp';

export async function detectLicensePlate(imageBuffer: Buffer): Promise<string | null> {
  try {
    // 1. Pre-process Image with Sharp
    // - Resize: Upscale slightly to help with small text
    // - Grayscale: Remove color noise
    // - Threshold: Binarize (make high contrast black/white)
    const processedBuffer = await sharp(imageBuffer)
      .resize(800, null, { fit: 'inside', withoutEnlargement: false }) // Ensure decent width
      .grayscale()
      .threshold(128) // Simple binarization
      .toBuffer();

    console.log('[OCR] Image pre-processed successfully.');

    // Dynamically resolve the worker path to handle the "ROOT" path error
    const workerPath = path.join(process.cwd(), 'node_modules', 'tesseract.js', 'src', 'worker-script', 'node', 'index.js');

    // 2. OCR with Tesseract
    // Using createWorker for fine-grained control (parameters)
    const worker = await Tesseract.createWorker('eng', 1, {
      workerPath,
      langPath: path.join(process.cwd(), 'public', 'ocr-data'),
      cachePath: path.join(process.cwd(), 'public', 'ocr-cache'),
      gzip: false,
      logger: m => console.log(m)
    });

    // Whitelist: ONLY allow uppercase letters, numbers, and hyphen
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ',
    });

    const { data: { text: rawText } } = await worker.recognize(processedBuffer);
    await worker.terminate();

    if (!rawText) return null;

    console.log('[OCR] Raw text:', rawText);
    const textToProcess = rawText;

    // 3. Post-Processing & Extraction
    // Normalize text: remove everything except A-Z, 0-9
    const lines = textToProcess.split('\n').map(l => l.trim().toUpperCase());

    // Pattern 1: Standard Indian Format (e.g., MH 20 EE 7602)
    // Code: [A-Z]{2} [0-9]{2} [A-Z]{1,2} [0-9]{4}
    // We scan for this specific sequence ignoring spaces
    const indianPlateRegex = /([A-Z]{2}[0-9]{2}[A-Z]{1,3}[0-9]{3,4})/;

    // Pattern 2: Generic fallback (e.g., ABC-123, 4-12 chars strict)
    const genericPlateRegex = /^[A-Z0-9-]{4,12}$/;

    let bestMatch: string | null = null;

    for (const line of lines) {
      // Clean the line completely for pattern matching
      const cleanLine = line.replace(/[^A-Z0-9]/g, '');

      // Check Pattern 1 (Strong Match)
      const indianMatch = cleanLine.match(indianPlateRegex);
      if (indianMatch) {
        console.log('[OCR] Found Strong Pattern Match:', indianMatch[0]);
        return indianMatch[0]; // Return immediately if we find a standard plate
      }

      // Check Pattern 2 (Fallback candidates)
      // We clean with hyphens for the generic check if we want to support dashes
      const cleanLineWithCurrent = line.replace(/[^A-Z0-9-]/g, '');
      if (genericPlateRegex.test(cleanLineWithCurrent)) {
        if (!bestMatch) bestMatch = cleanLineWithCurrent;
      }
    }

    return bestMatch || lines.reduce((longest, current) => {
      // Fallback: Pick the longest line that has at least some alphanumeric content
      // This answers the user's request to "extract whatever is written"
      const clean = current.replace(/[^A-Z0-9-]/g, '');
      return clean.length > longest.length ? clean : longest;
    }, '');
  } catch (error) {
    console.error('OCR Error:', error);
    return null;
  }
}
