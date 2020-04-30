import { observable, computed } from 'mobx';

class FileDropStore {
  @observable file = null;
  @observable hoverCounter = 0;

  constructor() {
  }

  @computed get isHovering() {
    return this.hoverCounter !== 0;
  }

  @computed get hasDropped() {
    return !!this.file;
  }

  @computed get fileName() {
    return this.file && this.file.name;
  }

  onDragEnter = (e) => {
    this.hoverCounter += 1;
  };

  onDragLeave = (e) => {
    this.hoverCounter -= 1;
  };

  onDragOver = (e) => {
    e.preventDefault();
  };

  onDrop = (e) => {
    e.preventDefault();
    this.filesDropped(e.dataTransfer.files);
  };

  filesDropped = (files) => {
    this.hoverCounter = 0;

    if (files.length === 1) {
      this.fileDropped(files[0]);
    }
  };

  fileDropped = (file) => {
    this.file = file;
    const fileReader = new FileReader();
    fileReader.onload = this.fileLoaded;
    fileReader.readAsDataURL(file);
  };

  fileLoaded = (e) => {
    console.log('file loaded', e)
  };
}

export default FileDropStore;