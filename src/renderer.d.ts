declare global {
  interface Window {
    api: IElectronAPI;
  }
}
export interface IElectronAPI {
  toggleDraw: () => void;
  onClearCanvas: (callback: () => void) => void;
  onStartRecord: (callback: () => void) => void;
  onStartRecordAfterCountdown: (callback: () => void) => void;
  onPauseRecord: (callback: () => void) => void;
  onResumeRecord: (callback: () => void) => void;

  getSources: () => Promise<any[]>;
  selectSource: (source: any) => Promise<void>;
  startRecording: () => void;
  startAfterCountdown: () => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  toggleRecording: () => void;
  onSaveVideo: (callback: (args: any) => void) => void;

  // * Analyze video
  selectVideoToAnalyze: () => void;
  onAnalyzeSuccess: (callback: (args: AnalyzeSuccessArgs) => void) => void;

  // * Merge video
  selectVideoToMerge: () => Promise<any>;
  selectPathToSaveFile: () => Promise<any>;
  mergeVideos: (videoPaths: string[], filePath: string) => Promise<void>;
  onMergingVideo: (callback: (args: any) => void) => void;
}

export interface AnalyzeSuccessArgs {
  resultList: WhisperResultItem[];
  filePath: string;
  inferenceTimeInMs: number;
}

export interface WhisperResultItem {
  /** eg. 00:00:08,000  */
  startTimeStr: string;
  /** eg. 00:00:08,000  */
  endTimeStr: string;

  text: string;
}
