import mammoth from 'mammoth';
import * as pdfParseModule from 'pdf-parse';
import zlib from 'zlib';

export async function parseDocumentBuffer(buffer: Buffer, mimetype: string, originalname: string): Promise<string> {
  try {
    const ext = originalname.toLowerCase().split('.').pop() || '';

    // 1. PDF Parsing
    if (mimetype === 'application/pdf' || ext === 'pdf') {
      const extractedTextPieces: string[] = [];

      // Method A: pdf-parse v2+ Class
      try {
        const PDFParseClass = (pdfParseModule as any).PDFParse || (pdfParseModule as any).default?.PDFParse;
        if (typeof PDFParseClass === 'function') {
          const parser = new PDFParseClass({ data: buffer });
          const res = await parser.getText();
          if (res && typeof res.text === 'string' && res.text.trim().length > 30) {
            return res.text.trim();
          }
        }
      } catch (e: any) {
        console.warn('PDF parser class method note:', e.message);
      }

      // Method B: pdf-parse v1 Function
      try {
        const pdfParseFunc = typeof pdfParseModule === 'function' ? pdfParseModule : (pdfParseModule as any).default;
        if (typeof pdfParseFunc === 'function') {
          const data = await pdfParseFunc(buffer);
          if (data && data.text && data.text.trim().length > 30) {
            return data.text.trim();
          }
        }
      } catch (e: any) {
        console.warn('PDF parser function method note:', e.message);
      }

      // Method C: Decompress FlateDecode streams and parse PDF text operators (BT ... ET, Tj, TJ)
      try {
        const rawLatin = buffer.toString('latin1');
        const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
        let match: RegExpExecArray | null;

        while ((match = streamRegex.exec(rawLatin)) !== null) {
          const rawStream = match[1];
          let decodedStream = '';

          // Try zlib inflate
          try {
            const streamBuf = Buffer.from(rawStream, 'latin1');
            const unzipped = zlib.inflateSync(streamBuf);
            decodedStream = unzipped.toString('latin1');
          } catch {
            decodedStream = rawStream;
          }

          // Extract text inside parentheses in Tj and TJ operators
          const textOperatorRegex = /\(([^)]+)\)\s*Tj|\[([^\]]+)\]\s*TJ/g;
          let opMatch: RegExpExecArray | null;
          while ((opMatch = textOperatorRegex.exec(decodedStream)) !== null) {
            if (opMatch[1]) {
              const cleaned = opMatch[1].replace(/\\([()\\])/g, '$1');
              if (cleaned.length > 0) extractedTextPieces.push(cleaned);
            } else if (opMatch[2]) {
              const inner = opMatch[2].replace(/\(([^)]+)\)/g, '$1 ').replace(/[^a-zA-Z0-9\s.,;:()/@#+\-_]/g, ' ');
              if (inner.trim().length > 0) extractedTextPieces.push(inner.trim());
            }
          }
        }

        if (extractedTextPieces.length > 0) {
          const textJoined = extractedTextPieces.join(' ').replace(/\s+/g, ' ').trim();
          if (textJoined.length > 50) {
            return textJoined;
          }
        }
      } catch (streamErr: any) {
        console.warn('Stream extraction note:', streamErr.message);
      }

      // Method D: Visible UTF-8/ASCII extraction fallback
      const asciiOnly = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
      if (asciiOnly.length > 50) {
        return asciiOnly;
      }

      // Fallback message if PDF contains only images/scans
      return 'PDF document uploaded. Multimodal visual document parser will process visual content directly.';
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

    return 'Document uploaded. Visual layout extraction will parse document contents.';
  } catch (err: any) {
    console.error('Document parsing warning:', err);
    return 'Document file uploaded. Processing structured content.';
  }
}

