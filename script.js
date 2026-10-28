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
  console.log('host() was called');  // Add this FIRST line	
  const code = Math.random().toString(36).substr(2, 4).toUpperCase();
  role = 'host';
  
  // Show the code immediately
  document.getElementById('setup').style.display = 'none';
  document.getElementById('info').style.display = 'block';
  document.getElementById('code').textContent = code;
  document.getElementById('status').textContent = 'Accessing camera...';
  
  const stream = await getMediaStream();
  if (!stream) return;
  
  peer = new Peer(code);
  
  peer.on('open', () => {
    document.getElementById('status').textContent = 'Waiting for guest...';
  });

  peer.on('call', (call) => {
    // Answer the incoming call and send video stream
    call.answer(localStream);
    
    // Handle remote stream (guest's stream if they send one)
    call.on('stream', (remoteStream) => {
      document.getElementById('remoteVideo').srcObject = remoteStream;
      document.getElementById('remoteVideoContainer').style.display = 'block';
    });

    document.getElementById('status').textContent = 'Connected!';
    document.getElementById('streamStatus').textContent = 'Streaming video...';
  });

  peer.on('error', (e) => {
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
    // Call the host WITHOUT sending our own stream (unidirectional)
    const call = peer.call(code);
    
    call.on('stream', (remoteStream) => {
      document.getElementById('remoteVideo').srcObject = remoteStream;
      document.getElementById('remoteVideoContainer').style.display = 'block';
      document.getElementById('status').textContent = 'Connected!';
      document.getElementById('streamStatus').textContent = 'Receiving stream...';
    });

    call.on('error', (e) => {
      document.getElementById('status').textContent = 'Error: ' + e.message;
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
