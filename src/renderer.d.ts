declare global {
  interface Window {
    api: IElectronAPI;
  }
}
export interface IElectronAPI {
  toggleDraw: () => void;
  onClearCanvas: (callback: () => void) => void;

  onSourceWindowReady : (callback: () => void) => void;
  getSources: () => Promise<any[]>;
  selectSource: (sourceId: string) => Promise<void>;
  startRecording: () => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  toggleRecording: () => void;
}
