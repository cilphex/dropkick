let Config = require('./config');
// let ServerUITemplate = require('./templates/server');

// class ServerUIElement extends React.Component {
//   constructor() {
//     super();
//     this.state = {
//       test: 'bacon2',
//       one: true,
//       three: 'asdf'
//     };
//   }
//
//   dragEnter(e) {
//     console.log('drag enter', e, this);
//   }
//
//   dragLeave(e) {
//     console.log('drag leave', e);
//   }
//
//   dragOver(e) {
//     console.log('drag over', e);
//   }
//
//   dragDrop(e) {
//     console.log('drag drop', e);
//   }
//
//   componentDidMount() {
//     window.addEventListener('dragenter', this.dragEnter.bind(this));
//     window.addEventListener('dragleave', this.dragLeave.bind(this));
//     window.addEventListener('dragover', this.dragOver.bind(this));
//     window.addEventListener('dragdrop', this.dragDrop.bind(this));
//
//     console.log('this.props.visible', this.props.visible);
//   }
//
//   componentWillUnmount() {
//     window.removeEventListener('dragenter', this.dragEnter.bind(this));
//     window.removeEventListener('dragleave', this.dragLeave.bind(this));
//     window.removeEventListener('dragover', this.dragOver.bind(this));
//     window.removeEventListener('dragdrop', this.dragDrop.bind(this));
//   }
//
//   render() {
//     return ServerUITemplate(this);
//   }
// }
//
// ServerUIElement.propTypes = {};
// ServerUIElement.defaultProps = {};

class ServerUI {
  constructor() {
    // ReactDOM.render(
    //   <ServerUIElement/>,
    //   document.getElementById('view')
    // );
  }
}

// class ServerUI {
//   constructor(server) {
//     this.server = server;
//     this.hover_counter = 0;
//     this.setupListeners();
//     $('.server-view').show();
//   }
//
//   fileLoaded(e) {
//     $('.drop-a-file').text(this.file.name);
//     $(document.body).addClass('dropped');
//     $('.share-url input').val(Config.url + '?c=' + this.server.uuid);
//     $('.share-url').removeClass('hidden');
//     console.log('file loaded', e);
//   }
//
//   fileDropped(file) {
//     this.file = file; // should go in Server?
//     this.server.setFile(this.file);
//     let fileReader = new FileReader();
//     fileReader.onload = this.fileLoaded.bind(this);
//     fileReader.readAsDataURL(file);
//   }
//
//   filesDropped(files) {
//     if (files.length === 1) {
//       this.fileDropped(files[0]);
//     }
//   }
//
//   dragEnter(e) {
//     this.hover_counter += 1;
//     $(document.body).addClass('drop-hover');
//   }
//
//   dragLeave(e) {
//     this.hover_counter -= 1;
//     if (!this.hover_counter) {
//       $(document.body).removeClass('drop-hover');
//     }
//   }
//
//   dragOver(e) {
//     e.preventDefault();
//   }
//
//   dragDrop(e) {
//     e.preventDefault();
//     $(document.body).removeClass('drop-hover');
//     this.filesDropped(e.originalEvent.dataTransfer.files);
//   }
//
//   selectShareUrl(e) {
//     e.preventDefault();
//     $('.share-url input').select();
//   }
//
//   rejectUser(e) {
//     e.preventDefault();
//     console.log('Server UI: rejectUser');
//   }
//
//   approveUser(e) {
//     e.preventDefault();
//     console.log('Server UI: approveUser');
//     $('.pending-approval').hide();
//     $('.sending-to-user').show();
//     this.server.sendFile();
//   }
//
//   setupListeners() {
//     $(document).on('dragenter', 'body', this.dragEnter.bind(this));
//     $(document).on('dragleave', 'body', this.dragLeave.bind(this));
//     $(document).on('dragover', 'body', this.dragOver.bind(this));
//     $(document).on('drop', 'body', this.dragDrop.bind(this));
//     $(document).on('focus', '.share-url input', this.selectShareUrl.bind(this));
//     $(document).on('click', '.reject-user', this.rejectUser.bind(this));
//     $(document).on('click', '.approve-user', this.approveUser.bind(this));
//   }
//
//   waiting() {
//     console.log('waiting');
//     $('.share-url').hide();
//     $('.connected-and-waiting').show();
//   }
//
//   setStream(stream) {
//     this.video = document.querySelector('.remote-selfie');
//     this.video.src = window.URL.createObjectURL(stream);
//   }
//
//   clientSnap() {
//     this.video.pause();
//     $('.connected-and-waiting').hide();
//     $('.pending-approval').show();
//   }
//
//   done() {
//     $('.sending-to-user').hide();
//     $('.sent-to-user').show();
//   }
// }

module.exports = ServerUI;
