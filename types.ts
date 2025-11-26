export enum AppState {
  LANDING = 'LANDING',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT'
}

export interface UploadedClip {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
}

export interface ProcessingStep {
  text: string;
  progress: number;
}
