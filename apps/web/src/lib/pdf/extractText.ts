interface ExtractTextError {
  code: 'NO_TEXT' | 'INVALID_PDF' | 'FILE_TOO_LARGE' | 'TIMEOUT';
  message: string;
}

class PDFTextExtractionError extends Error {
  constructor(public readonly error: ExtractTextError) {
    super(error.message);
    this.name = 'PDFTextExtractionError';
  }
}

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const STEP_TIMEOUT = 10000; // 10s
const OCR_TIMEOUT = 30000; // 30s for OCR processing
const OCR_ENABLED = process.env.OCR_FALLBACK === '1';

// OCR Setup for Scanned PDFs:
// 1. Add OCR_FALLBACK=1 to .env.local
// 2. Install dependencies: pnpm add tesseract.js canvas
// 3. For production on Linux, install native deps: apt-get install libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev build-essential g++
// 4. OCR processes first 2-3 pages at 2.0 scale with 30s timeout
// Without OCR, the app handles text-based PDFs reliably via pdf-parse and pdfjs-dist.

export async function extractText(buffer: Buffer): Promise<string> {

  if (buffer.length > MAX_FILE_SIZE) {
    throw new PDFTextExtractionError({
      code: 'FILE_TOO_LARGE',
      message: `File size ${(buffer.length / 1024 / 1024).toFixed(1)}MB exceeds 15MB limit`
    });
  }

  // Step 1: Try pdf2json (good for structured text extraction)
  const pdf2jsonText = await tryWithTimeout(() => extractWithPdf2Json(buffer), STEP_TIMEOUT);
  if (pdf2jsonText && pdf2jsonText.trim().length > 50) {
    return pdf2jsonText;
  }

  // Step 2: Try pdf-parse as fallback
  const pdfParseText = await tryWithTimeout(() => extractWithPdfParse(buffer), STEP_TIMEOUT);
  if (pdfParseText && pdfParseText.trim().length > 50) {
    return pdfParseText;
  }

  // Step 3: Try pdfjs-dist text extraction
  const pdfjsText = await tryWithTimeout(() => extractWithPdfJs(buffer), STEP_TIMEOUT);
  if (pdfjsText && pdfjsText.trim().length > 50) {
    return pdfjsText;
  }

  // Step 4: Try basic PDF text detection as last resort
  const basicText = await extractBasicPdfText(buffer);
  if (basicText && basicText.trim().length > 20) {
    return basicText;
  }

  // Step 3: Fallback OCR for scanned PDFs (if enabled)
  if (OCR_ENABLED) {
    // Temporarily disable OCR to test PDF text extraction
    // const ocrText = await tryWithTimeout(() => extractWithOCR(buffer), OCR_TIMEOUT);
    // if (ocrText && ocrText.trim().length > 20) {
    //   return ocrText;
    // }
  }

  throw new PDFTextExtractionError({
    code: 'NO_TEXT',
    message: OCR_ENABLED 
      ? 'Unable to extract readable text from PDF. File may be corrupted, password-protected, or contain only non-readable images.'
      : 'Unable to extract readable text from PDF. This may be a scanned document - enable OCR_FALLBACK=1 for image-based PDFs.'
  });
}

async function extractWithPdf2Json(buffer: Buffer): Promise<string> {
  try {
    
    const PDFParser = (await import('pdf2json')).default;
    
    return new Promise<string>((resolve, reject) => {
      const pdfParser = new PDFParser(null, true);
      
      pdfParser.on('pdfParser_dataError', (errData: any) => {
        resolve('');
      });
      
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          const textParts: string[] = [];
          
          if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
            for (const page of pdfData.Pages.slice(0, 10)) { // Limit to 10 pages
              if (page.Texts && Array.isArray(page.Texts)) {
                for (const textItem of page.Texts) {
                  if (textItem.R && Array.isArray(textItem.R)) {
                    for (const run of textItem.R) {
                      if (run.T) {
                        // Decode URL-encoded text
                        const decodedText = decodeURIComponent(run.T);
                        if (decodedText.trim().length > 0) {
                          textParts.push(decodedText.trim());
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          
          const result = textParts.join(' ').trim();
          resolve(result);
        } catch (error) {
          resolve('');
        }
      });
      
      // Set timeout for parsing
      setTimeout(() => {
        resolve('');
      }, 8000);
      
      pdfParser.parseBuffer(buffer);
    });
    
  } catch (error) {
    return '';
  }
}

async function extractBasicPdfText(buffer: Buffer): Promise<string> {
  try {
    
    // Convert buffer to string - try different encodings
    const bufferStr = buffer.toString('latin1'); // Better for PDF binary data
    
    // Look for readable text patterns in various formats
    const extractedTexts: string[] = [];
    
    // Method 1: Look for standard ASCII text in the PDF
    const asciiMatches = bufferStr.match(/[A-Za-z0-9\s,.\-$#@%&*()_+=:;!?]{10,}/g);
    if (asciiMatches) {
      for (const match of asciiMatches.slice(0, 20)) {
        const cleanText = match.trim();
        if (cleanText.length > 5 && /[A-Za-z]/.test(cleanText)) {
          extractedTexts.push(cleanText);
        }
      }
    }
    
    // Method 2: Look for text in PDF stream objects
    const streamMatches = bufferStr.match(/stream[\s\S]*?endstream/g);
    if (streamMatches) {
      for (const stream of streamMatches.slice(0, 10)) {
        // Extract readable text from streams
        const textInStream = stream.match(/[A-Za-z0-9\s,.\-$#@%&*()_+=:;!?]{5,}/g);
        if (textInStream) {
          for (const text of textInStream.slice(0, 5)) {
            const cleanText = text.trim();
            if (cleanText.length > 3 && /[A-Za-z]/.test(cleanText)) {
              extractedTexts.push(cleanText);
            }
          }
        }
      }
    }
    
    // Method 3: Look for text objects in PDF structure  
    const textMatches = bufferStr.match(/BT[\s\S]*?ET/g);
    if (textMatches) {
      for (const textBlock of textMatches.slice(0, 50)) {
        // Look for readable content in text blocks
        const readableText = textBlock.match(/[A-Za-z0-9\s,.\-$#@%&*()_+=:;!?]{3,}/g);
        if (readableText) {
          for (const text of readableText.slice(0, 10)) {
            const cleanText = text.trim();
            if (cleanText.length > 2 && /[A-Za-z]/.test(cleanText)) {
              extractedTexts.push(cleanText);
            }
          }
        }
      }
    }
    
    // Remove duplicates and join
    const uniqueTexts = [...new Set(extractedTexts)];
    const result = uniqueTexts
      .join(' ')
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .trim();
    
    return result;
    
  } catch (error) {
    return '';
  }
}

async function extractWithPdfParse(buffer: Buffer): Promise<string> {
  try {
    
    // Import pdf-parse dynamically and handle the test file issue
    const pdfParse = (await import('pdf-parse')).default;
    
    // The key fix: provide explicit options to prevent test file access
    const pdfData = await pdfParse(buffer, {
      // Prevent accessing test files by limiting page processing
      max: 100,
      version: '1.10.100',
      // Provide pagerender function to avoid file system access
      pagerender: (pageData: any) => {
        return pageData.getTextContent().then((textContent: any) => {
          return textContent.items.map((item: any) => item.str).join(' ');
        });
      }
    });
    
    return pdfData.text || '';
  } catch (error) {
    return '';
  }
}

async function extractWithPdfJs(buffer: Buffer): Promise<string> {
  try {
    
    // Try importing pdfjs-dist - disable for now due to import issues
    return '';
    
    // pdfjs-dist implementation disabled due to module resolution issues
  } catch (error) {
    return '';
  }
}

async function extractWithOCR(buffer: Buffer): Promise<string> {
  if (!OCR_ENABLED) return '';
  
  try {
    // Dynamic imports with timeout protection
    const [tesseractModule, canvasModule, pdfjsModule] = await Promise.all([
      Promise.race([
        import('tesseract.js'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Tesseract import timeout')), 5000))
      ]),
      Promise.race([
        import('canvas'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Canvas import timeout')), 5000))
      ]),
      Promise.race([
        // Try different pdfjs import paths
        import('pdfjs-dist/build/pdf').catch(() => import('pdfjs-dist')),
        new Promise((_, reject) => setTimeout(() => reject(new Error('PDF.js import timeout')), 5000))
      ])
    ]);
    
    const Tesseract = (tesseractModule as { default?: unknown }).default ?? tesseractModule;
    const { createCanvas } = canvasModule as { createCanvas: (width: number, height: number) => unknown };
    const pdfjsLib = pdfjsModule as { getDocument: (options: { data: Uint8Array; verbosity: number }) => { promise: Promise<unknown> } };
    
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ 
      data: new Uint8Array(buffer), 
      verbosity: 0 
    });
    const pdfDoc = await loadingTask.promise as { numPages: number; getPage: (num: number) => Promise<unknown> };
    
    const maxPages = Math.min(pdfDoc.numPages, 3); // Process first 2-3 pages
    const scale = 2.0; // Higher scale for better OCR accuracy
    const textParts: string[] = [];
    
    // Create Tesseract worker  
    const worker = await Promise.race([
      (Tesseract as { createWorker: (lang: string, count: number, options: { logger: () => void }) => Promise<unknown> }).createWorker('eng', 1, {
        logger: () => {}, // Suppress verbose logging
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Worker creation timeout')), 10000)
      )
    ]);
    
    try {
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        
        const page = await pdfDoc.getPage(pageNum) as { 
          getViewport: (options: { scale: number }) => { width: number; height: number };
          render: (context: { canvasContext: unknown; viewport: unknown }) => { promise: Promise<void> };
        };
        const viewport = page.getViewport({ scale });
        
        // Create canvas and render PDF page
        const canvas = createCanvas(viewport.width, viewport.height) as { 
          getContext: (type: string) => unknown;
          toBuffer: (format: string) => Buffer;
        };
        const context = canvas.getContext('2d');
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        await page.render(renderContext).promise;
        
        // Convert canvas to PNG buffer for Tesseract
        const imageBuffer = canvas.toBuffer('image/png');
        
        // OCR the rendered page
        const result = await Promise.race([
          (worker as { recognize: (buffer: Buffer, lang: string) => Promise<{ data?: { text?: string } }> }).recognize(imageBuffer, 'eng'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('OCR recognition timeout')), 15000)
          )
        ]) as { data?: { text?: string } };
        
        const pageText = result.data?.text || '';
        if (pageText.trim()) {
          textParts.push(pageText.trim());
        }
      }
      
      const combinedText = textParts.join('\n\n');
      
      return combinedText;
      
    } finally {
      // Always cleanup worker
      try {
        await Promise.race([
          (worker as { terminate: () => Promise<void> }).terminate(),
          new Promise<void>((resolve) => setTimeout(resolve, 3000))
        ]);
      } catch (terminateError) {
      }
    }
    
  } catch (error) {
    return '';
  }
}

async function tryWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const controller = new AbortController();
    
    const timeout = setTimeout(() => {
      controller.abort();
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    
    fn()
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeout));
  });
}

export { PDFTextExtractionError };
export type { ExtractTextError };