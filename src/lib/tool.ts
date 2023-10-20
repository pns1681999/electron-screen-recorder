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
