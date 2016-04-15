class ClientUI {
  constructor(client, stream) {
    this.client = client;
    this.stream = stream;
    this.setupListeners();
    this.setupVideo();
    // this.setupSelfie(); // has to be called from Client after stuff is loaded
    $('.app-client').show();
  }

  setupListeners() {
    // ideally this would not be allowed until the video.loadedmetadata callback
    $(document).on('click', '.snap-photo', this.snapPhoto.bind(this));
  }

  setupVideo() {
    this.video = window.video = document.querySelector('.local-selfie');
    this.video.src = window.URL.createObjectURL(this.stream);
  }

  snapPhoto(e) {
    this.video.pause();
    $(this.video).addClass('paused');
    $('.snap-button').hide();
    $('.waiting-for-decision').show();
    this.client.sendSnap();
  }
}

module.exports = ClientUI;
