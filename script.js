let peer, conn, localStream, role;
const isMobile = /iPhone|iPad|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Video constraints for 1280x720
const videoConstraints = {
  audio: true,
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'user'
  }
};

async function getMediaStream() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia(videoConstraints);
    document.getElementById('localVideo').srcObject = localStream;
    return localStream;
  } catch (error) {
    document.getElementById('streamStatus').textContent = 'Error: Cannot access camera/mic. ' + error.message;
    console.error('Media access error:', error);
    return null;
  }
}

async function host() {
  console.log('host() was called');
  role = 'host';
  
  document.getElementById('setup').style.display = 'none';
  document.getElementById('info').style.display = 'block';
  document.getElementById('status').textContent = 'Accessing camera...';
  
  const stream = await getMediaStream();
  if (!stream) return;
  
  peer = new Peer();  // No custom ID — let PeerJS generate it
  console.log('Peer created');
  
  peer.on('open', (id) => {
    console.log('Peer ID received:', id);
    document.getElementById('code').textContent = id;  // Display the real ID
    document.getElementById('status').textContent = 'Waiting for guest...';
  });

  peer.on('call', (call) => {
    call.answer(localStream);
    call.on('stream', (remoteStream) => {
      document.getElementById('remoteVideo').srcObject = remoteStream;
      document.getElementById('remoteVideoContainer').style.display = 'block';
    });
    document.getElementById('status').textContent = 'Connected!';
    document.getElementById('streamStatus').textContent = 'Streaming video...';
  });

  peer.on('error', (e) => {
    console.error('Peer error:', e);
    document.getElementById('status').textContent = 'Error: ' + e.message;
  });
}

async function join() {
  const code = document.getElementById('joinCode').value.toUpperCase();
  if (!code) return;
  role = 'guest';
  
  document.getElementById('setup').style.display = 'none';
  document.getElementById('info').style.display = 'block';
  document.getElementById('status').textContent = 'Connecting to host...';
  
  peer = new Peer();
  
  peer.on('open', () => {
  console.log('Guest peer ID:', peer.id);
  console.log('Calling host with code:', code);
  
  const call = peer.call(code);
  
  if (!call) {
    document.getElementById('status').textContent = 'Error: Failed to call host. Wrong code?';
    console.error('peer.call() returned undefined. Host ID may be invalid.');
    return;
  }
  
  call.on('stream', (remoteStream) => {
    console.log('Received stream from host');
    document.getElementById('remoteVideo').srcObject = remoteStream;
    document.getElementById('remoteVideoContainer').style.display = 'block';
    document.getElementById('status').textContent = 'Connected!';
    document.getElementById('streamStatus').textContent = 'Receiving stream...';
  });

  call.on('error', (e) => {
    document.getElementById('status').textContent = 'Call error: ' + e.message;
  });

  call.on('close', () => {
    document.getElementById('status').textContent = 'Connection closed';
    document.getElementById('remoteVideoContainer').style.display = 'none';
  });
});

  peer.on('error', (e) => {
    document.getElementById('status').textContent = 'Error: ' + e.message;
  });
}

function stopStream() {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
}

window.addEventListener('beforeunload', stopStream);
