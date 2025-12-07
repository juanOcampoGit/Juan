export enum FileType {
  PDF = 'application/pdf',
  PNG = 'image/png',
  JPG = 'image/jpeg',
  JPEG = 'image/jpeg'
}

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  type: string;
  size: number;
  previewUrl?: string;
}

export interface ProcessingStatus {
  isProcessing: boolean;
  message: string;
  error?: string;
}
