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

// https://trac.ffmpeg.org/wiki/Encode/H.264
const VIDEO_OPTIONS: Record<string, string> = {
  mergeVideo: '-map [video]',
  mergeAudio: '-map [audio]',

  film: '-tune film',
  animation: '-tune animation',

  // https://trac.ffmpeg.org/wiki/Encode/H.264#LosslessH.264
  libx264: '-c:v libx264',
  libvpx: '-c:v libvpx',

  crf23: '-crf 23',
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
