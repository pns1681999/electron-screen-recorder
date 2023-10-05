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
}
