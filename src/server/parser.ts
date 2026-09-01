import mammoth from 'mammoth';
import * as pdfParseModule from 'pdf-parse';

export async function parseDocumentBuffer(buffer: Buffer, mimetype: string, originalname: string): Promise<string> {
  try {
    const ext = originalname.toLowerCase().split('.').pop() || '';

    // 1. PDF Parsing
    if (mimetype === 'application/pdf' || ext === 'pdf') {
      try {
        // Check if PDFParse is exported as a class (pdf-parse v2+)
        const PDFParseClass = (pdfParseModule as any).PDFParse || (pdfParseModule as any).default?.PDFParse;
        if (typeof PDFParseClass === 'function') {
          const parser = new PDFParseClass({ data: buffer });
          const res = await parser.getText();
          if (res && typeof res.text === 'string' && res.text.trim().length > 0) {
            return res.text.trim();
          }
        }

        // Check if pdfParse is exported directly as a function (pdf-parse v1)
        const pdfParseFunc = typeof pdfParseModule === 'function' ? pdfParseModule : (pdfParseModule as any).default;
        if (typeof pdfParseFunc === 'function') {
          const data = await pdfParseFunc(buffer);
          if (data && data.text && data.text.trim().length > 0) {
            return data.text.trim();
          }
        }
      } catch (pdfErr: any) {
        console.warn('Primary PDF parser encountered an issue, trying raw text fallback:', pdfErr.message);
      }

      // PDF text extraction fallback from buffer streams
      const rawString = buffer.toString('latin1');
      const textChunks: string[] = [];
      const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
      let match: RegExpExecArray | null;
      while ((match = streamRegex.exec(rawString)) !== null) {
        const cleaned = match[1].replace(/[^a-zA-Z0-9\s.,;:()/@#+\-_]/g, ' ').replace(/\s+/g, ' ');
        if (cleaned.length > 20) {
          textChunks.push(cleaned);
        }
      }
      if (textChunks.length > 0) {
        const extracted = textChunks.join('\n').trim();
        if (extracted.length > 50) {
          return extracted;
        }
      }

      // Last resort: extract visible ASCII characters from PDF
      const asciiOnly = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
      if (asciiOnly.length > 100) {
        return asciiOnly;
      }

      throw new Error('Could not extract readable text from this PDF file. Please ensure it contains selectable text.');
    }

    // 2. Word Document Parsing (DOCX / DOC)
    if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      ext === 'docx' ||
      mimetype === 'application/msword' ||
      ext === 'doc'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      if (result && result.value && result.value.trim().length > 0) {
        return result.value.trim();
      }
      throw new Error('DOCX parsing resulted in empty text');
    }

    // 3. Plain Text / Markdown
    if (mimetype.startsWith('text/') || ext === 'txt' || ext === 'md' || ext === 'rtf') {
      return buffer.toString('utf-8').trim();
    }

    // 4. General fallback: try utf-8 text conversion
    const fallbackText = buffer.toString('utf-8');
    if (fallbackText.length > 20) {
      return fallbackText.trim();
    }

    throw new Error(`Unsupported document format (${mimetype || ext}). Please upload a PDF, DOCX, or TXT file.`);
  } catch (err: any) {
    console.error('Document parsing error:', err);
    throw new Error(`Failed to extract text from file: ${err.message}`);
  }
}

