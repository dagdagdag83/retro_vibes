import { db, auth, lib } from './firebase';

const { collection, doc, setDoc, onSnapshot, addDoc, deleteDoc, serverTimestamp } = lib;

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

class WebRTCManager {
  constructor(roomId) {
    this.roomId = roomId;
    this.peerConnections = new Map();
    this.dataChannels = new Map();
    this.onDataChannelMessage = null; // Callback for incoming messages
    this.onPeerConnect = null; // Callback for when a new peer connects
    this.onPeerDisconnect = null; // Callback for when a peer disconnects
    this.localId = null;
  }

  async joinRoom() {
    return new Promise((resolve) => {
      lib.onAuthStateChanged(auth, async (user) => {
        if (user) {
          this.localId = user.uid;
          await this._listenForPeers();
          resolve(this.localId);
        } else {
          await lib.signInAnonymously(auth);
        }
      });
    });
  }

  async _listenForPeers() {
    const roomRef = collection(db, 'rooms', this.roomId, 'peers');
    onSnapshot(roomRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const peerId = change.doc.id;
        if (peerId === this.localId) return;

        if (change.type === 'added') {
          if (!this.peerConnections.has(peerId)) {
            this._createPeerConnection(peerId, true);
          }
        }
        if (change.type === 'removed') {
          this._closePeerConnection(peerId);
        }
      });
    });

    const selfRef = doc(db, 'rooms', this.roomId, 'peers', this.localId);
    await setDoc(selfRef, { joined: serverTimestamp() });
  }

  _createPeerConnection(peerId, isInitiator) {
    const pc = new RTCPeerConnection(servers);
    this.peerConnections.set(peerId, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidateRef = collection(db, 'rooms', this.roomId, 'peers', this.localId, 'candidates');
        addDoc(candidateRef, { ...event.candidate.toJSON(), for: peerId });
      }
    };

    const handleDataChannel = (channel) => {
      this.dataChannels.set(peerId, channel);
      channel.onmessage = (messageEvent) => {
        if (this.onDataChannelMessage) {
          const event = JSON.parse(messageEvent.data);
          // Inject the sender ID into the event for the app to use
          this.onDataChannelMessage({ ...event, senderId: peerId });
        }
      };
      channel.onopen = () => {
        if (this.onPeerConnect) this.onPeerConnect(peerId);
      };
      channel.onclose = () => this._closePeerConnection(peerId);
    };

    pc.ondatachannel = (event) => handleDataChannel(event.channel);

    if (isInitiator) {
      const dataChannel = pc.createDataChannel('main');
      handleDataChannel(dataChannel);
    }

    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        this._closePeerConnection(peerId);
      }
    };

    this._listenForSignaling(peerId, pc, isInitiator);
  }

  async _listenForSignaling(peerId, pc, isInitiator) {
    const offerRef = doc(db, 'rooms', this.roomId, 'peers', peerId, 'offers', this.localId);
    const answerRef = doc(db, 'rooms', this.roomId, 'peers', peerId, 'answers', this.localId);
    const candidatesRef = collection(db, 'rooms', this.roomId, 'peers', peerId, 'candidates');

    onSnapshot(offerRef, async (snapshot) => {
      if (snapshot.exists() && !isInitiator) {
        await pc.setRemoteDescription(new RTCSessionDescription(snapshot.data()));
        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);
        const myAnswerRef = doc(db, 'rooms', this.roomId, 'peers', this.localId, 'answers', peerId);
        await setDoc(myAnswerRef, { type: 'answer', sdp: answerDescription.sdp });
      }
    });

    onSnapshot(answerRef, async (snapshot) => {
      if (snapshot.exists() && isInitiator && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(snapshot.data()));
      }
    });

    onSnapshot(candidatesRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added' && change.doc.data().for === this.localId) {
          await pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        }
      });
    });

    if (isInitiator) {
      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);
      const myOfferRef = doc(db, 'rooms', this.roomId, 'peers', this.localId, 'offers', peerId);
      await setDoc(myOfferRef, { type: 'offer', sdp: offerDescription.sdp });
    }
  }

  sendTo(peerId, data) {
    const channel = this.dataChannels.get(peerId);
    if (channel?.readyState === 'open') {
      channel.send(JSON.stringify(data));
    }
  }

  broadcast(data) {
    const message = JSON.stringify(data);
    this.dataChannels.forEach((channel) => {
      if (channel.readyState === 'open') {
        channel.send(message);
      }
    });
  }

  _closePeerConnection(peerId) {
    this.peerConnections.get(peerId)?.close();
    this.peerConnections.delete(peerId);
    this.dataChannels.delete(peerId);
    if (this.onPeerDisconnect) this.onPeerDisconnect(peerId);
  }

  async leaveRoom() {
    this.peerConnections.forEach((pc, peerId) => this._closePeerConnection(peerId));
    const selfRef = doc(db, 'rooms', this.roomId, 'peers', this.localId);
    await deleteDoc(selfRef);
  }
}

export default WebRTCManager;