import React, { useState } from 'react';
import './App.css';

const Popup = ({ message, onClose }) => (
  <div className="popup-overlay">
    <div className="popup">
      <p>{message}</p>
      <button className="popup-button" onClick={onClose}>OK</button>
    </div>
  </div>
);

const ImageCompressor = () => {
  const [originalFile, setOriginalFile] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [compressedImage, setCompressedImage] = useState(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [dimensions, setDimensions] = useState({ width: null, height: null, aspectRatio: 1 });
  const [options, setOptions] = useState({
    quality: 0.8,
    fileType: 'image/jpeg',
    maxWidth: 0,
    maxHeight: 0,
    maintainAspectRatio: true,
  });

  const openPopup = (message) => {
    setPopupMessage(message);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupMessage('');
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      openPopup('Please select a valid image file');
      return;
    }
    setOriginalFile(file);
    setOriginalSize(file.size);
    const fileUrl = URL.createObjectURL(file);
    setOriginalImage(fileUrl);
    setCompressedImage(null);
    setError('');

    // Get image dimensions and set initial options
    const img = new Image();
    img.src = fileUrl;
    img.onload = () => {
      const w = img.width;
      const h = img.height;
      const ratio = w / h;
      setDimensions({ width: w, height: h, aspectRatio: ratio });
      setOptions(prev => ({ ...prev, maxWidth: w, maxHeight: h }));
      openPopup('Image uploaded successfully!');
    };
  };

  const compressImage = async () => {
    if (!originalFile) {
      setError('No image uploaded.');
      openPopup('No image uploaded.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const img = new Image();
      const fileUrl = URL.createObjectURL(originalFile);
      img.src = fileUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Calculate dimensions, maintaining aspect ratio if set
      let finalWidth = options.maxWidth;
      let finalHeight = options.maxHeight;
      if (options.maintainAspectRatio) {
        const ratio = dimensions.aspectRatio || 1;
        if (finalWidth / finalHeight > ratio) {
          finalWidth = finalHeight * ratio;
        } else {
          finalHeight = finalWidth / ratio;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, options.fileType, options.quality);
      });
      if (blob) {
        if (compressedImage) URL.revokeObjectURL(compressedImage);
        const compressedUrl = URL.createObjectURL(blob);
        setCompressedImage(compressedUrl);
        setCompressedSize(blob.size);
        openPopup('Image compressed successfully!');
      }
    } catch (err) {
      setError('Failed to compress image. Please try again.');
      openPopup('Failed to compress image. Please try again.');
    }
    setLoading(false);
  };

  const handleDimensionChange = (dimension, value) => {
    const newValue = Number(value);
    if (isNaN(newValue)) return;
    if (options.maintainAspectRatio) {
      const ratio = dimensions.aspectRatio || 1;
      if (dimension === 'maxWidth') {
        setOptions(prev => ({
          ...prev,
          maxWidth: newValue,
          maxHeight: Math.round(newValue / ratio)
        }));
      } else if (dimension === 'maxHeight') {
        setOptions(prev => ({
          ...prev,
          maxHeight: newValue,
          maxWidth: Math.round(newValue * ratio)
        }));
      }
    } else {
      setOptions(prev => ({ ...prev, [dimension]: newValue }));
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="container">
      <header>
        <h1>Image Compressor</h1>
        <p className="subtitle">Optimize your images with precision control</p>
      </header>

      <div className="dropzone">
        <input 
          id="fileInput"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="file-input"
        />
        <div className="dropzone-content">
          <p>Drop image here or click to browse</p>
          <small>Supports JPEG, PNG, WEBP</small>
        </div>
      </div>

      {originalImage && (
        <div className="preview-section">
          <h3>Uploaded Image Preview</h3>
          <img src={originalImage} alt="Uploaded preview" className="uploaded-image" />
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {originalImage && (
        <div className="controls-card">
          <div className="controls-header">
            <h3>Compression Settings</h3>
          </div>
          <div className="controls-grid">
            <div className="control-group">
              <label>Quality ({Math.round(options.quality * 100)}%)</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.01"
                value={options.quality}
                onChange={(e) =>
                  setOptions(prev => ({ ...prev, quality: Number(e.target.value) }))
                }
              />
            </div>

            <div className="control-group">
              <label>Output Format</label>
              <select
                value={options.fileType}
                onChange={(e) =>
                  setOptions(prev => ({ ...prev, fileType: e.target.value }))
                }
              >
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
                <option value="image/webp">WEBP</option>
              </select>
            </div>

            <div className="control-group">
              <div className="dimension-controls">
                <div className="dimension-input-group">
                  <label>Width</label>
                  <input
                    type="number"
                    value={options.maxWidth}
                    onChange={(e) => handleDimensionChange('maxWidth', e.target.value)}
                    min="100"
                    max="3840"
                  />
                </div>
                <div className="dimension-input-group">
                  <label>Height</label>
                  <input
                    type="number"
                    value={options.maxHeight}
                    onChange={(e) => handleDimensionChange('maxHeight', e.target.value)}
                    min="100"
                    max="3840"
                  />
                </div>
                <button
                  className="aspect-ratio-toggle"
                  onClick={() =>
                    setOptions(prev => ({
                      ...prev,
                      maintainAspectRatio: !prev.maintainAspectRatio
                    }))
                  }
                >
                  {options.maintainAspectRatio ? 'Unlock Ratio' : 'Lock Ratio'}
                </button>
              </div>
            </div>
          </div>
          <button className="compress-button" onClick={compressImage} disabled={loading}>
            {loading ? 'Processing...' : 'Compress Image'}
          </button>
        </div>
      )}

      {compressedImage && (
        <div className="results-container">
          <div className="image-comparison">
            <div className="image-container">
              <h4>Original</h4>
              <img src={originalImage} alt="Original" />
              <div className="image-stats">
                Size: {formatSize(originalSize)}
              </div>
            </div>
            <div className="image-container">
              <h4>Compressed</h4>
              <img src={compressedImage} alt="Compressed" />
              <div className="image-stats">
                Size: {formatSize(compressedSize)}
                <span className="reduction">
                  ({((1 - compressedSize / originalSize) * 100).toFixed(1)}% reduction)
                </span>
              </div>
            </div>
          </div>
          <div className="download-section">
            <a
              href={compressedImage}
              download={`compressed.${options.fileType.split('/')[1]}`}
              className="download-button"
            >
              Download Compressed Image
            </a>
          </div>
        </div>
      )}

      {showPopup && <Popup message={popupMessage} onClose={closePopup} />}
    </div>
  );
};

export default ImageCompressor;
