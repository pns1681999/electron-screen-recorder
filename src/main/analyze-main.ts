import { app, dialog } from 'electron';
import path from 'path';
import { performance } from 'perf_hooks';
import { WhisperResultItem } from 'src/renderer';
import { promisify } from 'util';
import { AnalyzeWindow } from './windows/analyze-window';

// * Import whisper

const whisperAddonPath =
  process.platform === 'win32'
    ? // Windows
      'addons/windows/whisper-addon'
    : process.arch === 'arm64'
    ? // Mac M1
      'addons/mac/arm64/whisper-addon'
    : // Mac Intel
      'addons/mac/x64/whisper-addon';

const { whisper } = require(path.join(__dirname, whisperAddonPath)) as {
  whisper: any;
};

// * Import ffmpeg
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static-electron');
const ffprobe = require('ffprobe-static-electron');
ffmpeg.setFfprobePath(ffprobe.path);
ffmpeg.setFfmpegPath(ffmpegStatic.path);

export const handleSelectVideoToAnalyze = async () => {
  const response = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      {
        name: 'Videos & Audios',
        extensions: [...videoExts, ...audioExts],
      },
    ],
  });

  if (response.canceled || response.filePaths.length <= 0) {
    return;
  }

  const inputFilePath = response.filePaths[0];
  const wavFilePath = await convertToStandardWav(inputFilePath);

  // Create a result window
  const win = new AnalyzeWindow();

  // Then run inference on the file
  const { rawResultList, inferenceTimeInMs } = await analyzeVideo(wavFilePath);

  const whisperResultList: WhisperResultItem[] = rawResultList.map(
    (rawResult) => ({
      startTimeStr: rawResult[0],
      endTimeStr: rawResult[1],
      text: rawResult[2],
    })
  );

  win.webContents.send('analyze-success', {
    filePath: inputFilePath,
    resultList: whisperResultList,
    inferenceTimeInMs,
  });
};

const analyzeVideo = async (
  filePath: string
): Promise<{
  rawResultList: WhisperRawResult[];
  inferenceTimeInMs: number;
}> => {
  const inferenceStartTime = performance.now();

  const runWhisper = promisify(whisper);
  const rawResultList = await runWhisper({
    language: 'ja',
    model: path.join(__dirname, 'assets/ggml-small.bin'),
    fname_inp: filePath,
  });

  const inferenceEndTime = performance.now();

  return {
    rawResultList,
    inferenceTimeInMs: inferenceEndTime - inferenceStartTime,
  };
};

// [startTime, endTime, transcript]
type WhisperRawResult = [string, string, string];

/** Convert to 16kHz pcm wav audio file to run on whisper */
const convertToStandardWav = (inputFilePath: string): Promise<string> => {
  const tempDirPath = app.getPath('temp');
  const outputFilePath = path.join(tempDirPath, 'temp-audio.wav');

  return new Promise((resolve, reject) => {
    ffmpeg(inputFilePath)
      .audioFrequency(16000)
      .outputOptions('-acodec pcm_s16le')
      .output(outputFilePath)
      .on('end', () => {
        resolve(outputFilePath);
      })
      .on('error', (err: any) => {
        reject(err);
      })
      .run();
  });
};

const videoExts = [
  'mp4',
  'avi',
  'mkv',
  'mov',
  'wmv',
  'flv',
  'webm',
  '3gp',
  'mpeg',
];
const audioExts = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'wma', 'm4a'];
