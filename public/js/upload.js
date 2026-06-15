// Client-side controller for the operator upload portal

document.addEventListener('DOMContentLoaded', () => {
  checkSessionState();
  setupDragAndDrop();
});

function checkSessionState() {
  const authContainer = document.getElementById('auth-container');
  const appContainer = document.getElementById('app-container');

  if (window.LogBukAuth.isAuthenticated('upload')) {
    authContainer.style.display = 'none';
    appContainer.style.display = 'flex';
  } else {
    authContainer.style.display = 'flex';
    appContainer.style.display = 'none';
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const pinInput = document.getElementById('pin-input');
  const errorDiv = document.getElementById('auth-error');
  const submitBtn = document.getElementById('unlock-btn');

  errorDiv.style.display = 'none';
  submitBtn.disabled = true;
  submitBtn.innerText = 'Unlocking...';

  const result = await window.LogBukAuth.loginWithPin(pinInput.value, 'upload');

  submitBtn.disabled = false;
  submitBtn.innerText = 'Unlock Interface';

  if (result.success) {
    pinInput.value = '';
    checkSessionState();
  } else {
    errorDiv.innerText = result.error;
    errorDiv.style.display = 'block';
    pinInput.focus();
  }
}

function handleLogout() {
  window.LogBukAuth.clearSession();
  checkSessionState();
  resetUploadState();
}

function triggerFileInput() {
  document.getElementById('file-input').click();
}

// Set up drag and drop hover states on the upload zone
function setupDragAndDrop() {
  const zone = document.getElementById('upload-zone');
  
  ['dragenter', 'dragover'].forEach(eventName => {
    zone.addEventListener(eventName, (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    zone.addEventListener(eventName, (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
    }, false);
  });

  zone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, false);
}

function handleFileSelection(event) {
  const files = event.target.files;
  if (files.length > 0) {
    processFile(files[0]);
  }
}

// Compress image and execute the upload process
function processFile(file) {
  if (!file.type.match('image.*')) {
    alert('Please select a valid image file (PNG, JPG, WEBP).');
    return;
  }

  // Show preview thumbnail of the original selected file
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('preview-thumbnail').src = e.target.result;
    document.getElementById('preview-section').style.display = 'flex';
    
    // Scale and compress the image before sending to the server
    compressAndUpload(file);
  };
  reader.readAsDataURL(file);
}

function compressAndUpload(file) {
  const img = new Image();
  img.src = URL.createObjectURL(file);
  
  img.onload = () => {
    // Release the object URL
    URL.revokeObjectURL(img.src);

    const maxDimension = 1600;
    let width = img.width;
    let height = img.height;

    // Calculate optimal dimensions
    if (width > height) {
      if (width > maxDimension) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      }
    } else {
      if (height > maxDimension) {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    // Export to JPEG with 0.8 quality for high resolution but small filesize
    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
    
    uploadImagePayload(compressedBase64);
  };
}

async function uploadImagePayload(base64Image) {
  const statusCard = document.getElementById('status-section');
  const loader = document.getElementById('status-loader');
  const successIcon = document.getElementById('status-success-icon');
  const title = document.getElementById('status-main-title');
  const descr = document.getElementById('status-sub-title');
  const uploadZone = document.getElementById('upload-zone');

  // Disable upload area during active operation
  uploadZone.style.pointerEvents = 'none';
  uploadZone.style.opacity = '0.5';

  // Setup initial status view
  statusCard.style.display = 'block';
  loader.style.display = 'block';
  successIcon.style.display = 'none';
  statusCard.style.borderColor = 'var(--border-color)';
  statusCard.style.backgroundColor = 'var(--bg-card)';
  
  title.innerText = 'Uploading...';
  descr.innerText = 'Transferring logbook page to archives';

  // State update scheduler for seamless UX
  let elapsed = 0;
  const interval = setInterval(() => {
    elapsed += 100;
    if (elapsed === 1200) {
      title.innerText = 'Processing...';
      descr.innerText = 'Extracting handwriting and table headers';
    } else if (elapsed === 3200) {
      title.innerText = 'Saving...';
      descr.innerText = 'Synchronizing structured rows with database';
    }
  }, 100);

  try {
    const token = window.LogBukAuth.getSessionToken();
    const response = await fetch('/api/process-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ image: base64Image })
    });

    clearInterval(interval);
    
    const result = await response.json();

    if (response.ok && result.success) {
      // Transition to complete success state
      loader.style.display = 'none';
      successIcon.style.display = 'block';
      successIcon.style.color = 'var(--success-color)';
      statusCard.style.borderColor = 'rgba(16, 185, 129, 0.2)';
      statusCard.style.backgroundColor = 'var(--success-light)';
      title.innerText = 'Completed ✓';
      descr.innerText = 'Logbook digitized successfully';
      
      // Auto-reset the screen for the next upload after 4 seconds
      setTimeout(resetUploadState, 4000);
    } else {
      clearInterval(interval);
      handleUploadError(result.error || 'Upload failed. Please try again.');
    }
  } catch (error) {
    clearInterval(interval);
    console.error('Upload error:', error);
    handleUploadError('Upload failed. Please try again.');
  }
}

function handleUploadError(errorText) {
  const statusCard = document.getElementById('status-section');
  const loader = document.getElementById('status-loader');
  const successIcon = document.getElementById('status-success-icon');
  const title = document.getElementById('status-main-title');
  const descr = document.getElementById('status-sub-title');
  const uploadZone = document.getElementById('upload-zone');

  loader.style.display = 'none';
  successIcon.style.display = 'none';
  statusCard.style.borderColor = 'rgba(239, 68, 68, 0.2)';
  statusCard.style.backgroundColor = 'var(--danger-light)';
  
  title.innerText = 'Processing failed';
  title.style.color = 'var(--danger-color)';
  descr.innerText = errorText;

  // Re-enable upload capability
  uploadZone.style.pointerEvents = 'auto';
  uploadZone.style.opacity = '1';
}

function resetUploadState() {
  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');
  
  uploadZone.style.pointerEvents = 'auto';
  uploadZone.style.opacity = '1';
  fileInput.value = '';
  
  document.getElementById('status-section').style.display = 'none';
  document.getElementById('preview-section').style.display = 'none';
  document.getElementById('preview-thumbnail').src = '';
  
  const title = document.getElementById('status-main-title');
  title.style.color = 'var(--text-main)';
}
