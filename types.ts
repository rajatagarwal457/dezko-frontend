export enum AppState {
  LANDING = 'LANDING',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT',
  DASHBOARD = 'DASHBOARD'
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

export type VideoStatus = 'generating' | 'completed' | 'failed';

export interface VideoRender {
  id: string;
  filename: string;
  status: VideoStatus;
  createdAt: number;
  clipNames: string[];
  userId: string;
  videoUrl?: string;
}
