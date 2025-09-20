import { getIceServers, SIGNALING_SERVER_URL } from './internet-config.js';

class WebRTCCore {
  constructor(socketUrl = SIGNALING_SERVER_URL) {
    this.socket = io(socketUrl);
    this.peer = null;
    this.localStream = null;
    this.remoteStreamCallback = null;
    this.currentCaller = null;
    this.dataChannel = null;
    this.onDataChannelCallback = null;

    this.iceServers = getIceServers();
  }

  initialize(userId) {
    this.socket.emit('register', userId);
  }

  startCall(targetId, stream, callerLang) {
    this.localStream = stream;
    this.peer = new RTCPeerConnection({ iceServers: this.iceServers });

    stream.getTracks().forEach(track => {
      this.peer.addTrack(track, stream);
    });

    this.dataChannel = this.peer.createDataChannel('chat');
    this.setupDataChannelHandlers();

    this.peer.ontrack = event => {
      if (this.remoteStreamCallback) {
        this.remoteStreamCallback(event.streams[0]);
      }
    };

    this.peer.onicecandidate = event => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', {
          to: targetId,
          candidate: event.candidate
        });
      }
    };

    this.peer.createOffer()
      .then(offer => this.peer.setLocalDescription(offer))
      .then(() => {
        this.socket.emit('call', {
          to: targetId,
          offer: this.peer.localDescription,
          callerLang
        });
      });

    return this.dataChannel;
  }

  handleIncomingCall(offer, localStream, callback) {
    this.peer = new RTCPeerConnection({ iceServers: this.iceServers });

    if (localStream) {
      localStream.getTracks().forEach(track => {
        this.peer.addTrack(track, localStream);
      });
    }

    this.peer.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannelHandlers();
    };

    this.peer.ontrack = event => callback(event.streams[0]);

    this.peer.onicecandidate = event => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', {
          to: this.currentCaller,
          candidate: event.candidate
        });
      }
    };

    this.peer.setRemoteDescription(new RTCSessionDescription(offer))
      .then(() => this.peer.createAnswer())
      .then(answer => this.peer.setLocalDescription(answer))
      .then(() => {
        this.socket.emit('answer', {
          to: this.currentCaller,
          answer: this.peer.localDescription
        });
      });

    return this.dataChannel;
  }

  setupDataChannelHandlers() {
    this.dataChannel.onopen = () => {
      console.log('DataChannel conectado');
    };

    this.dataChannel.onmessage = (event) => {
      if (this.onDataChannelCallback) {
        this.onDataChannelCallback(event.data);
      }
    };
  }

  setupSocketHandlers() {
    this.socket.on('acceptAnswer', data => {
      if (this.peer) {
        this.peer.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    this.socket.on('ice-candidate', candidate => {
      if (this.peer) {
        this.peer.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    this.socket.on('incomingCall', data => {
      this.currentCaller = data.from;
      if (this.onIncomingCall) {
        this.onIncomingCall(data.offer, data.callerLang);
      }
    });
  }

  setRemoteStreamCallback(callback) {
    this.remoteStreamCallback = callback;
  }

  setDataChannelCallback(callback) {
    this.onDataChannelCallback = callback;
  }

  sendText(message) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(message);
    }
  }
}

export default WebRTCCore;
