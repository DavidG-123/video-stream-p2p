// script.js
let peer, conn;
const GRID_SIZE = 8;
const TILE_COUNT = GRID_SIZE * GRID_SIZE; // 64 tiles

// Canvas state: array of 64 color values
let myCanvas = new Array(TILE_COUNT).fill('#ffffff');
let peerCanvas = new Array(TILE_COUNT).fill('#ffffff');
let selectedColor = '#3498db';

function initializeCanvases() {
  renderCanvas('canvas', myCanvas);
  renderCanvas('peerCanvas', peerCanvas);
}

function renderCanvas(canvasId, canvasData) {
  const container = document.getElementById(canvasId);
  container.innerHTML = ''; // Clear
  
  canvasData.forEach((color, index) => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.style.backgroundColor = color;
    tile.onclick = () => tileClicked(index);
    container.appendChild(tile);
  });
}

function tileClicked(index) {
  myCanvas[index] = selectedColor;
  renderCanvas('canvas', myCanvas);
}

function setColor(color) {
  selectedColor = color;
  document.getElementById('colorPicker').value = color;
}

function updateColorFromPicker() {
  selectedColor = document.getElementById('colorPicker').value;
}

// Serialize canvas to JSON (very compact)
function serializeCanvas(canvasData) {
  return JSON.stringify(canvasData);
}

// Deserialize canvas from JSON
function deserializeCanvas(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error('Failed to deserialize canvas:', e);
    return null;
  }
}

function sendCanvas() {
  if (conn && conn.open) {
    const serialized = serializeCanvas(myCanvas);
    conn.send(serialized);
    document.getElementById('status').textContent = `Canvas sent (${serialized.length} bytes)`;
  } else {
    document.getElementById('status').textContent = 'Not connected!';
  }
}

function host() {
  const code = Math.random().toString(36).substr(2, 4).toUpperCase();
  peer = new Peer(code);
  
  peer.on('open', () => {
    document.getElementById('setup').style.display = 'none';
    document.getElementById('info').style.display = 'block';
    document.getElementById('code').textContent = code;
    document.getElementById('chatArea').style.display = 'block';
    
    // FIX: Use querySelector for class-based elements
    document.querySelector('.controls-section').style.display = 'block';
    document.getElementById('sendBtn').style.display = 'block';
    document.getElementById('status').textContent = 'Waiting for guest...';
    
    initializeCanvases();
  });
  
  peer.on('connection', (c) => {
    setupConnection(c);
    document.getElementById('status').textContent = 'Connected!';
  });
  
  peer.on('error', (e) => {
    document.getElementById('status').textContent = 'Error: ' + e;
  });
}

function join() {
  const code = document.getElementById('joinCode').value.toUpperCase();
  if (!code) return;
  
  peer = new Peer();
  
  peer.on('open', () => {
    conn = peer.connect(code);
    
    conn.on('open', () => {
      document.getElementById('setup').style.display = 'none';
      document.getElementById('chatArea').style.display = 'block';
      
      // FIX: Use querySelector for class-based elements
      document.querySelector('.controls-section').style.display = 'block';
      document.getElementById('sendBtn').style.display = 'block';
      document.getElementById('status').textContent = 'Connected!';
      
      initializeCanvases();
      setupConnection(conn);
    });
    
    conn.on('error', (e) => {
      document.getElementById('status').textContent = 'Error: ' + e;
    });
  });
}

function setupConnection(c) {
  conn = c;
  
  conn.on('data', (data) => {
    // Receive canvas from peer
    const receivedCanvas = deserializeCanvas(data);
    
    if (receivedCanvas && Array.isArray(receivedCanvas) && receivedCanvas.length === TILE_COUNT) {
      peerCanvas = receivedCanvas;
      renderCanvas('peerCanvas', peerCanvas);
      document.getElementById('status').textContent = `Peer sent canvas (${data.length} bytes)`;
    } else {
      console.error('Invalid canvas data received');
    }
  });
  
  conn.on('close', () => {
    document.getElementById('status').textContent = 'Connection closed';
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const colorPicker = document.getElementById('colorPicker');
  if (colorPicker) {
    colorPicker.addEventListener('change', updateColorFromPicker);
    colorPicker.addEventListener('input', updateColorFromPicker);
  }
  
  // Hide controls section until connected
  const controlsSection = document.querySelector('.controls-section');
  if (controlsSection) {
    controlsSection.style.display = 'none';
  }
});