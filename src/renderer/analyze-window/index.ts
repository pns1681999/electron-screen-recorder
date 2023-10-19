import './index.css';

window.api.onAnalyzeSuccess(({ filePath, resultList, inferenceTimeInMs }) => {
  // * Remove loading
  const loadingEl = document.getElementById('loading');
  loadingEl.parentNode.removeChild(loadingEl);

  // * Show main view
  document.getElementById('main-view').classList.remove('hidden');

  // * Render file name
  const fileName = filePath.replace(/^.*[\\\/]/, '');
  document.getElementById('file-name').textContent = fileName;

  // * Render inference time
  document.getElementById(
    'inference-time'
  ).textContent = `Analyzed in ${inferenceTimeInMs.toFixed(1)} ms`;

  // * Render transcrips
  const transcriptsContainerEl = document.getElementById(
    'transcripts-container'
  );

  if (resultList.length <= 0) {
    // Display "no result" text
    const noResultTextEl = document.createElement('div');
    noResultTextEl.textContent = 'No result';

    transcriptsContainerEl.append(noResultTextEl);
    return;
  }

  const resultElList = resultList.map((result) => {
    const itemEl = document.createElement('div');
    itemEl.classList.add('flex', 'items-center', 'py-2', 'border-b-2');

    const timeEl = document.createElement('div');
    timeEl.classList.add('w-36', 'text-gray-800', 'text-xs');

    // Cut off the milliseconds
    const startTime = result.startTimeStr.split(',')[0];
    const endTime = result.endTimeStr.split(',')[0];

    timeEl.textContent = `${startTime} - ${endTime}`;

    const transcriptTextEl = document.createElement('div');
    transcriptTextEl.classList.add('flex-1');
    transcriptTextEl.textContent = result.text;

    itemEl.append(timeEl);
    itemEl.append(transcriptTextEl);
    return itemEl;
  });

  transcriptsContainerEl.append(...resultElList);
});

document.getElementById('analyze-btn').addEventListener('click', () => {
  window.api.selectVideoToAnalyze();
});
