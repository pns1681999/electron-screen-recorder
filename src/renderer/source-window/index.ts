import './index.css';
import { Modal } from 'flowbite';
import type { ModalOptions, ModalInterface } from 'flowbite';

const btnAnalyzeVideo = document.getElementById('btn-analyze');
const btnRecordVideo = document.getElementById('btn-record');
const btnMergeVideo = document.getElementById('btn-merge');
const $modalElement: HTMLElement = document.querySelector('#popup-modal');

let modal: ModalInterface = null;
let source: any = null;

// any button with class modal-close-button will close the modal
document.querySelectorAll('.modal-close-button').forEach((button) => {
  button.addEventListener('click', () => {
    modal?.hide();
  });
});

// define Progress Bar class

const startRerecording = () => {
  modal.hide();
  console.log('start rerecording');
  window.api.selectSource(source);
};

const showSourceListModal = (sources: any[]) => {
  const selectButton = document.getElementById('btn-select-source');

  const modalOptions: ModalOptions = {
    onHide: () => {
      console.log('modal is hidden');
      // remove event listener from select button
      selectButton.removeEventListener('click', startRerecording);
    },
    onShow: () => {
      console.log('modal is shown');
      source = null;
    },
  };

  // build modal content
  const listElement = document.getElementById('source-list');
  const listItems = sources.map((item: any) => {
    const listItem = document.createElement('div');
    listItem.classList.add(
      'flex',
      'flex-col',
      'justify-between',
      'items-center',
      'p-4',
      'text-dark-500',
      'font-bold'
    );
    listItem.innerHTML = `
      <img src="${item.thumbnail}" alt="${item.name}" class="w-32 h-24 cursor-pointer hover:opacity-75 "/>
      <div class="text-sm">${item.name}</div>
    `;

    listItem.addEventListener('click', () => {
      // send source to actionWindow
      // set selected class
      listItem.classList.add('border-2', 'border-red-400');
      // remove selected class from other list items
      const listItems = document.querySelectorAll('#source-list > div');
      listItems.forEach((item: any) => {
        if (item !== listItem) {
          item.classList.remove('border-2', 'border-red-400');
        }
      });
      source = item;
      if (source) {
        selectButton.addEventListener('click', startRerecording);
      }
    });
    return listItem;
  });

  // append list items to list element
  // clear list element
  listElement.innerHTML = '';
  listItems.forEach((listItem: any) => {
    listElement.appendChild(listItem);
  });

  // show modal
  modal = new Modal($modalElement, modalOptions);
  modal.show();
};

const buildListElement = (sources: any[]) => {
  return sources.map((item: any) => {
    const listItem = document.createElement('div');
    listItem.classList.add(
      'flex',
      'flex-col',
      'justify-between',
      'items-center',
      'p-4',
      'text-dark-500',
      'font-bold',
      'video-item'
    );
    listItem.innerHTML = `
      <img src="${item.thumbnail}" alt="${item.filePath}" class="w-32 h-24 cursor-pointer hover:opacity-75 data-path="${item.filePath}"/>
      <div class="text-sm">${item.name}</div>
    `;
    return listItem;
  });
};

const showMergeVideoModal = (sources: any[]) => {
  if (sources.length === 0) {
    return;
  }

  // hide modal if it is already shown
  modal?.hide();

  const $modalElm: HTMLElement = document.querySelector('#merge-modal');

  // build modal content
  const listElement = document.getElementById('merge-list');

  const listItems = buildListElement(sources);
  // append list items to list element
  // clear list element
  listElement.innerHTML = '';
  listItems.forEach((listItem: any) => {
    listElement.appendChild(listItem);
  });

  // add a button to end of list
  const addButton = document.createElement('button');
  // add class: text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-500 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center
  addButton.classList.add(
    'text-white',
    'bg-blue-700',
    'hover:bg-blue-800',
    'dark:bg-blue-500',
    'font-medium',
    'rounded-lg',
    'text-sm',
    'px-2.5',
    'py-2.5'
  );
  // icon plus
  addButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  `;

  addButton.addEventListener('click', async () => {
    console.log('add button clicked');
    const files = await window.api.selectVideoToMerge();
    // add more files to list
    console.log('files', files);

    const listItems = buildListElement(files);
    // append list items to beginning of list element
    listItems.forEach((listItem: any) => {
      listElement.prepend(listItem);
    });
  });

  // wrap list element and add button in a div
  const listWrapper = document.createElement('div');
  listWrapper.classList.add(
    'flex',
    'flex-col',
    'items-center',
    'justify-center'
  );
  listWrapper.appendChild(addButton);

  listElement.appendChild(listWrapper);

  // add listener to merge button
  const mergeButton = document.getElementById('btn-merge-videos');

  mergeButton.addEventListener('click', async () => {
    console.log('merge button clicked');
    // get all selected videos
    const selectedVideos = document.querySelectorAll(
      '#merge-list > div.video-item'
    );
    console.log('selected videos', selectedVideos);
    const videoPaths = Array.from(selectedVideos).map((item: any) => {
      return item.querySelector('img').alt;
    });

    console.log('video paths', videoPaths);

    // ask user path to save file
    const { canceled, filePath } = await window.api.selectPathToSaveFile();
    if (canceled) {
      console.log('user canceled save video');
      return;
    }

    console.log('save video to', filePath);

    // add listener to show progress
    let total = 0;
    let progressBar: any = null;
    window.api.onMergingVideo((args: any) => {
      const { label, value, message, totalDuration } = args;
      if (label === 'Waiting') {
        // clear list element
        listElement.innerHTML = '';
        // create progress bar element
        progressBar = document.createElement('progress');
        listElement.appendChild(progressBar);
        total = totalDuration;

        // hide button merge
        mergeButton.classList.add('hidden');

        // set max value, value = 0
        progressBar.max = 100;
        progressBar.value = 0;

        // set style for progress bar, add class: w-full h-2 bg-gray-200 rounded-lg
        progressBar.classList.add('w-full', 'h-2', 'bg-gray-200', 'rounded-lg');
      } else if (label === 'Progress') {
        // update progress bar
        console.log('update progress bar event', args);
        const progress = Math.round((value / total) * 100);
        // console.log('progress', progress);
        progressBar.value = progress;
      } else if (label === 'Success') {
        console.log('merge success');
        progressBar.value = 100;

        // show file path at below progress bar
        const filePathElm = document.createElement('div');
        filePathElm.classList.add('text-sm', 'text-gray-500');
        filePathElm.innerHTML = filePath;
        listElement.appendChild(filePathElm);
        progressBar.classList.add('hidden');
      }

      // console.log('args', args);
    });
    await window.api.mergeVideos(videoPaths, filePath);
  });

  // show modal
  modal = new Modal($modalElm);
  modal.show();
};

// handle events save video(convert video)
const $progressBar = document.querySelector('#progress-bar');
const $progressLabel = document.querySelector('#progress-bar-value');
window.api.onSaveVideo((args: any) => {
  console.log('onSaveVideo', args);
  const { label, value, message } = args;
  if (label === 'Waiting') {
    // hide all action-btn buttons
    document.querySelectorAll('.action-btn').forEach((button) => {
      button.classList.add('hidden');
    });

    // show progress bar
    $progressBar.classList.remove('hidden');
  } else if (label === 'Progress') {
    // set label for progress bar
    $progressLabel.innerHTML = `${value.timemark}`;
  } else if (label === 'Success') {
    // show  all action-btn buttons
    document.querySelectorAll('.action-btn').forEach((button) => {
      button.classList.remove('hidden');
    });

    // hide progress bar
    $progressBar.classList.add('hidden');
  }
});

btnAnalyzeVideo.addEventListener('click', () => {
  window.api.selectVideoToAnalyze();
});

btnRecordVideo.addEventListener('click', async () => {
  console.log('record video');
  // handle select source
  const sources: any = await window.api.getSources();
  showSourceListModal(sources);
});

// merge video
btnMergeVideo.addEventListener('click', async () => {
  console.log('merge video');
  const files = await window.api.selectVideoToMerge();
  console.log('files', files);
  showMergeVideoModal(files);
});
