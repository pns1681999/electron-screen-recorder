const ffmpeg = require('fluent-ffmpeg');
const stream = require('stream');
const { join } = require('path');
const isDev = require('electron-is-dev');
import { VIDEO_FILTER, VIDEO_OPTIONS } from './tool';
// const process = require('child_process');

import { platform, arch, isWindows, isMac, isLinux } from './util';

let customFfPath = '';

// Note that this does not work on MAS because of sandbox restrictions
function setCustomFfPath(path) {
  customFfPath = path;
}
// const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
// const ffprobePath = require('@ffprobe-installer/ffprobe').path;
function getFfPath(cmd: string) {
  const exeName = isWindows ? `${cmd}.exe` : cmd;

  if (customFfPath) return join(customFfPath, exeName);

  if (isDev) {
    const components = ['./public', 'ffmpeg', `${platform}-${arch}`];
    if (isWindows || isLinux) components.push('lib');
    components.push(exeName);
    return join(...components);
  }

  return join(process.resourcesPath, exeName);
}

const getFfprobePath = () => getFfPath('ffprobe');
const getFfmpegPath = () => getFfPath('ffmpeg');

// console.log('ffmpeg path:', getFfmpegPath());
// console.log('ffprobe path:', getFfprobePath());

// ffmpeg.setFfmpegPath(ffmpegStatic.path);
// ffmpeg.setFfprobePath(ffprobeStatic.path);

ffmpeg.setFfmpegPath(getFfmpegPath());
ffmpeg.setFfprobePath(getFfprobePath());

// process.execSync(`./${getFfmpegPath()} && ffmpeg -version`);

const getVideoInfo = (filePath: string) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err: any, metadata: any) => {
      if (err) reject(err);
      else resolve(metadata);
    });
  });
};

const buildMergeVideoCommand = ({
  sources,
  fileType = 'mp4',
  filePath = 'output',
}: {
  sources: string[];
  fileType: string;
  filePath: string;
}) => {
  const namingInput = (index: number) => `${index}:v`;
  const namingOutput = (index: number) => `v${index}`;

  const configOption = {
    scale: 'hd',
    ratio: '4:3',
    export: 'mp4',
    fileName: `${filePath}.${fileType}`,
  };

  const ffmpegCmd = ffmpeg();

  sources.forEach((filePath: string) => {
    ffmpegCmd.input(filePath);
  });
  // "[0:v]scale=-2:720,format=yuv420p[v];[0:a]amerge=inputs=$(ffprobe -loglevel error -select_streams a -show_entries stream=codec_type -of csv=p=0 input.mov | wc -l)[a]"
  ffmpegCmd
    .complexFilter([
      ...sources.map(
        (_, index) =>
          `[${namingInput(index)}]${VIDEO_FILTER.scale(
            configOption.scale
          )},${VIDEO_FILTER.pad(configOption.scale)},${VIDEO_FILTER.aspectRatio(
            configOption.ratio
          )},format=yuv420p[${namingOutput(index)}]`
      ),
      sources
        .map((_, index) => `[${namingOutput(index)}][${index}:a]`)
        .join('')
        .concat(`concat=n=${sources.length}:v=1:a=1[video][audio]`),
    ])
    .outputOptions([
      VIDEO_OPTIONS.mergeVideo,
      VIDEO_OPTIONS.mergeAudio,
      // VIDEO_OPTIONS.animation,
      // VIDEO_OPTIONS.libx264,
      // VIDEO_OPTIONS.crf27,
      // VIDEO_OPTIONS.ultrafast,
      // VIDEO_OPTIONS.threads4,
      // VIDEO_OPTIONS.strict,
      '-ab 48000',
      '-ac 2',
      '-ar 22050',
      '-s 1280x720',
      '-vcodec libx264',
      '-crf 27',
      '-q 4',
      '-r 30',
      '-preset ultrafast',
      '-shortest',
      VIDEO_OPTIONS[configOption.export],
    ]);

  return ffmpegCmd;
};

const createReadableVideoBuffer = (videoBuffer: any) => {
  const readableVideoBuffer = new stream.PassThrough();
  readableVideoBuffer.end(videoBuffer);
  return readableVideoBuffer;
};

const createTaskConvertVideoFile = (videoBuffer: any, filePath: any) => {
  const ffmpegCmd = ffmpeg();
  const readableVideoBuffer = createReadableVideoBuffer(videoBuffer);
  return ffmpegCmd
    .input(readableVideoBuffer)
    .output(filePath)
    // set audio codec h 264
    .videoCodec('libx264')
    .format('mp4')
    .audioQuality(1)
    .audioFilters('volume=1.0');
};

export {
  setCustomFfPath,
  getFfmpegPath,
  getFfprobePath,
  ffmpeg,
  getVideoInfo,
  buildMergeVideoCommand,
  createTaskConvertVideoFile,
};
