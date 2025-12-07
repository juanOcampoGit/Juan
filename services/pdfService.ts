import { PDFDocument, PageSizes } from 'pdf-lib';
import { UploadedFile, FileType } from '../types';

/**
 * Reads a file as an ArrayBuffer
 */
const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Merges PDFs and Images into a single PDF document
 */
export const generateMergedPdf = async (files: UploadedFile[]): Promise<Uint8Array> => {
  // Create a new PDF document
  const mergedPdf = await PDFDocument.create();
  
  for (const fileItem of files) {
    const fileBuffer = await readFileAsArrayBuffer(fileItem.file);

    if (fileItem.type === FileType.PDF) {
      // Load the source PDF
      const pdf = await PDFDocument.load(fileBuffer);
      // Copy all pages
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      // Add pages to the new document
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    } else if (fileItem.type === FileType.PNG || fileItem.type === FileType.JPG || fileItem.type === FileType.JPEG) {
      // Handle Images
      let image;
      if (fileItem.type === FileType.PNG) {
        image = await mergedPdf.embedPng(fileBuffer);
      } else {
        image = await mergedPdf.embedJpg(fileBuffer);
      }

      // Create a standard A4 page
      const page = mergedPdf.addPage(PageSizes.A4); // [595.28, 841.89]
      const { width, height } = page.getSize();
      
      // Define margins
      const margin = 40;
      const maxWidth = width - (margin * 2);
      const maxHeight = height - (margin * 2);

      // Calculate scale to fit image within margins while maintaining aspect ratio
      const imgDims = image.scale(1);
      const scaleWidth = maxWidth / imgDims.width;
      const scaleHeight = maxHeight / imgDims.height;
      const scale = Math.min(scaleWidth, scaleHeight, 1); // Ensure we don't scale up small images excessively

      const displayWidth = imgDims.width * scale;
      const displayHeight = imgDims.height * scale;

      // Center the image
      const x = (width - displayWidth) / 2;
      const y = (height - displayHeight) / 2;

      page.drawImage(image, {
        x,
        y,
        width: displayWidth,
        height: displayHeight,
      });
    }
  }

  // Serialize the PDFDocument to bytes (a Uint8Array)
  const pdfBytes = await mergedPdf.save();
  return pdfBytes;
};

export const downloadPdf = (data: Uint8Array, filename: string) => {
  const blob = new Blob([data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
