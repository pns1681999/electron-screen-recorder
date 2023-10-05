import './index.css';
import { Modal } from 'flowbite';
import type { ModalOptions, ModalInterface } from 'flowbite';

const btnAnalyzeVideo = document.getElementById('btn-analyze');
const btnRecordVideo = document.getElementById('btn-record');
const $modalElement: HTMLElement = document.querySelector('#popup-modal');

let modal: ModalInterface = null;
let sourceId: string = null;

// close modal
document.querySelector('.modal-close-button').addEventListener('click', () => {
  console.log('close modal');
  modal?.hide();
});
const startRerecording = () => {
  modal.hide();
  console.log('start rerecording');
  window.api.selectSource(sourceId);
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
      sourceId = null;
    },
  };

  // build modal content
  const listElement = document.getElementById('source-list');
  const listItems = sources.map((source: any) => {
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
      <img src="${source.thumbnail}" alt="${source.name}" class="w-32 h-24 cursor-pointer hover:opacity-75 "/>
      <div class="text-sm">${source.name}</div>
    `;

    listItem.addEventListener('click', () => {
      // send sourceId to actionWindow
      // set selected class
      listItem.classList.add('border-2', 'border-red-400');
      // remove selected class from other list items
      const listItems = document.querySelectorAll('#source-list > div');
      listItems.forEach((item: any) => {
        if (item !== listItem) {
          item.classList.remove('border-2', 'border-red-400');
        }
      });
      sourceId = source.id;
      if (sourceId) {
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

btnAnalyzeVideo.addEventListener('click', () => {
  console.log('analyze video');
  // not implemented yet
  alert('Not implemented yet');
});

btnRecordVideo.addEventListener('click', async () => {
  console.log('record video');
  // handle select source
  const sources: any = await window.api.getSources();
  showSourceListModal(sources);
});
