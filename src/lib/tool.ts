const VIDEO_RESOLUTION: Record<string, string> = {
  sd: '640:360:force_original_aspect_ratio=decrease',
  hd: '1280:720:force_original_aspect_ratio=decrease',
  hd_plus: '1512:982:force_original_aspect_ratio=decrease',
  full_hd: '1920:1080:force_original_aspect_ratio=decrease',
  '2k': '2560:1440:force_original_aspect_ratio=decrease',
  '4k': '3840:2160:force_original_aspect_ratio=decrease',
}

const VIDEO_PAD: Record<string, string> = {
  sd: '640:360:(ow-iw)/2:(oh-ih)/2',
  hd: '1280:720:(ow-iw)/2:(oh-ih)/2',
  hd_plus: '1512:982:(ow-iw)/2:(oh-ih)/2',
  full_hd: '1920:1080:(ow-iw)/2:(oh-ih)/2',
  '2k': '2560:1440:(ow-iw)/2:(oh-ih)/2',
  '4k': '3840:2160:(ow-iw)/2:(oh-ih)/2',
}

const VIDEO_ASPECT_RATIO: Record<string, string> = {
  square: '1/1',
  '4:3': '4/3',
  '16:9': '16/9',
  '21:9': '21/9',
}

const VIDEO_FADE_ANIMATION: Record<string, string> = {
  out: 'fade=t=out:st=3:d=1',
  in: 'fade=t=in:st=0:d=1',
}

const VIDEO_OVERLAY: Record<string, string> = {
  shortest: '1',
}

/**
  scale = Scale (resize) the input video, using the libswscale library(scale=w:h)
  setsar = The setsar filter sets the Sample (aka Pixel) Aspect Ratio for the filter output video.
  concat = Concatenate audio and video streams, joining them together one after the other.
  n = Set the number of segments. Default is 2.
  v = Set the number of output video streams, that is also the number of video streams in each segment. Default is 1
  a = Set the number of output audio streams, that is also the number of audio streams in each segment. Default is 0.
  ab = Indicates the audio bitrate
  ac = Set the number of audio channels. For output streams it is set by default to the number of input audio channels. For input streams this option only makes sense for audio grabbing devices and raw demuxers and is mapped to the corresponding demuxer options.
  ar = Set the audio sampling frequency. For output streams it is set by default to the frequency of the corresponding input stream. For input streams this option only makes sense for audio grabbing devices and raw demuxers and is mapped to the corresponding demuxer options
  vcodec = Set the video codec
  libx264 = encodes all streams with libx264 and copies all streams
  crf = As others have pointed out (Thanks all), the values will depend on which encoder you're using. For x264 your valid range is 0-51: Where 0 is lossless, 23 is default, and 51 is worst possible. A lower value is a higher quality
  s = resolution of the given video file
 */

// https://trac.ffmpeg.org/wiki/Encode/H.264
const VIDEO_OPTIONS: Record<string, string> = {
  mergeVideo: '-map [video]',
  mergeAudio: '-map [audio]',

  film: '-tune film',
  animation: '-tune animation',

  // https://trac.ffmpeg.org/wiki/Encode/H.264#LosslessH.264
  libx264: '-vcodec libx264',

  crf23: '-crf 23', // default
  crf27: '-crf 27',

  // https://trac.ffmpeg.org/wiki/Encode/H.264#a2.Chooseapresetandtune
  slower: '-preset slower',
  slow: '-preset slow',
  medium: '-preset medium',
  fast: '-preset fast',
  faster: '-preset faster',
  veryfast: '-preset veryfast',
  superfast: '-preset superfast',
  ultrafast: '-preset ultrafast',

  // means 2 threads for video encoding
  threads2: '-threads 2',
  threads4: '-threads 4',

  ab48: '-ab 48k',
  ac2: '-ac 2',
  ar22050: '-ar 22050',

  shd: '-s 1280x720',
  // vcodec: '-vcodec libx264',
  q4: '-q 4',
  fps30: '-r 30',
  shortest: '-shortest',

  strict2: '-strict 2',

  mp4: '-f mp4',
  mov: '-f mov',
}

const VIDEO_FILTER = {
  scale: (resolution: string) => `scale=${VIDEO_RESOLUTION[resolution]}`,
  pad: (resolution: string) => `pad=${VIDEO_PAD[resolution]}`,
  aspectRatio: (aspectRatio: string) => `setdar=${VIDEO_ASPECT_RATIO[aspectRatio]}`,
  fade: (animation: string) => `${VIDEO_FADE_ANIMATION[animation]}`,
  overlay: (overlay: string) => `overlay=${VIDEO_OVERLAY[overlay]}`,
  format: (format = 'yuv420p') => `format=${format}`,
  fps: (val = 30) => `fps=${val}`,
}

export {
  VIDEO_RESOLUTION,
  VIDEO_PAD,
  VIDEO_ASPECT_RATIO,
  VIDEO_FADE_ANIMATION,
  VIDEO_OVERLAY,
  VIDEO_OPTIONS,
  VIDEO_FILTER,
}

/**
 * @description cmd adding silent audio in ffmpeg after merge multi video => take time
  //* CMD::: ffmpeg -i /Users/tinh/Downloads/2160 _3840_portrait_60fps.MOV -i /Users/tinh/Downloads/3840 _2160_landscape_60fps.MOV -i /Users/tinh/Downloads/a_720_1280_portrait_30fps.MOV -y -filter_complex [0]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setdar=16/9,format=yuv420p[v0];[1]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setdar=16/9,format=yuv420p[v1];[2]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setdar=16/9,format=yuv420p[v2];[v0][0:a][v1][1:a][v2][2:a]concat=n=3:v=1:a=1[video][audio] -map [video] -map [audio] -ab 48k -ac 2 -ar 22050 -s 1280x720 -crf 27 -vcodec libx264 -q 4 -r 30 -threads 2 -preset ultrafast -shortest -f mp4 /Users/tinh/Downloads/merge-vid-1698208281328.mp4
  //! CMD::: ffmpeg -i /Users/tinh/Downloads/1280 x720_v1.mp4 -i /Users/tinh/Downloads/1920 x1080_v2.mp4  -filter_complex "[0]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setdar=16/9,format=yuv420p[v0];[1]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setdar=16/9,format=yuv420p[v1];[v0][0:a][v1][1:a]concat=n=2:v=1:a=1[v][a]" -map "[v]" -map "[a]" -r 30 -c:v libx264 -c:a aac -movflags +faststart -y /Users/tinh/Downloads/merge-vid-1698208150215.mp4 

  */
  // const ffmpegCmd = executeFfmpeg(`-i ${sources} -f lavfi -i anullsrc -map 0:v -map 1:a -c:v copy -shortest`)
  // const hasExistedAudio = sources.every((_, index) => checkVideoHas(videoInfos[index]));
  // const ffmpegCmd = executeFfmpeg([
  //   ...sources.map((filePath: string) => `-i ${filePath} `),
  //   hasExistedAudio ? `-filter_complex ` : `-f lavfi -i anullsrc -filter_complex `,
  //   ...sources.map(
  //     (_, index) =>
  //       `[${namingInput(index)}]${VIDEO_FILTER.scale(
  //         configOption.scale
  //       )},${VIDEO_FILTER.pad(configOption.scale)},${VIDEO_FILTER.aspectRatio(
  //         configOption.ratio
  //       )},${VIDEO_FILTER.format()}[${namingOutput(index)}];`
  //   ),
  //   sources
  //     .map((_, index) => {
  //       const hasAudio = checkVideoHas(videoInfos[index]);
  //       const patchNoAudio = hasAudio ? `${index}:a` : `${sources.length}:a`

  //       return `[${namingOutput(index)}][${patchNoAudio}]`
  //     })
  //     .join('')
  //     .concat(`concat=n=${sources.length}:v=1:a=1[video][audio]`),
  //   ' -map [video] -map [audio] -ab 48k -ac 2 -ar 22050 -crf 27 -vcodec libx264 -q 4 -r 30 -threads 2 -preset ultrafast -shortest -f mp4',
    
  // ].join(''));