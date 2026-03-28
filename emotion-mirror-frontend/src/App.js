// src/App.js
import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import './App.css';

function App() {
  const webcamRef = useRef(null);
  const isAnalyzing = useRef(false);
  const [faceBox, setFaceBox] = useState(null);
  const [emotionData, setEmotionData] = useState({
    emotion: '',
    emoji: '⏳',
    quote: 'Waiting for your face...',
    status: 'Detecting emotion...'
  });

  const captureAndAnalyze = useCallback(async () => {
    if (webcamRef.current && !isAnalyzing.current) {
      isAnalyzing.current = true;
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        try {
          const response = await fetch('http://localhost:5000/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: imageSrc })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          const { emotion, emoji, quote } = data;
          
          if (emotion === "None") {
            setEmotionData({
              emotion: '',
              emoji: emoji,
              quote: quote,
              status: 'No face detected.'
            });
            setFaceBox(null);
          } else {
            setEmotionData({
              emotion,
              emoji: emoji,
              quote: quote,
              status: `Emotion: ${emotion.charAt(0).toUpperCase() + emotion.slice(1)}`,
              imageSize: data.imageSize
            });
            setFaceBox(data.box);
          }
        } catch (error) {
          console.error("Error analyzing image:", error);
          setEmotionData(prev => ({
            ...prev,
            emoji: '🔌',
            quote: 'Make sure the Python backend (server.py) is running.',
            status: 'Backend connection failed.'
          }));
        } finally {
          isAnalyzing.current = false;
        }
      } else {
        isAnalyzing.current = false;
      }
    }
  }, [webcamRef]);

  useEffect(() => {
    const interval = setInterval(() => {
      captureAndAnalyze();
    }, 2000); // Analyze every 2 seconds
    return () => clearInterval(interval);
  }, [captureAndAnalyze]);

  return (
    <div className="app">
      <h1 className="title">😊 Emotion Detection Mirror</h1>
      <p className="subtitle">Camera-based real-time emotion recognition using DeepFace API</p>
      
      <div className="main-content">
        <div className="webcam-container" style={{ position: 'relative' }}>
          <Webcam
            audio={false}
            ref={webcamRef}
            mirrored={true}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              width: 1280,
              height: 720,
              facingMode: "user",
            }}
          />
          {faceBox && emotionData.imageSize && (
            <div
              style={{
                position: 'absolute',
                border: '4px solid #00e5ff',
                borderRadius: '8px',
                boxShadow: '0 0 15px rgba(0, 229, 255, 0.6), inset 0 0 15px rgba(0, 229, 255, 0.4)',
                // The webcam screenshot is already mirrored by react-webcam, so coordinates are direct.
                left: `${(faceBox.x / emotionData.imageSize.width) * 100}%`,
                top: `${(faceBox.y / emotionData.imageSize.height) * 100}%`,
                width: `${(faceBox.w / emotionData.imageSize.width) * 100}%`,
                height: `${(faceBox.h / emotionData.imageSize.height) * 100}%`,
                transition: 'all 0.1s ease-out', // Faster tracking
                pointerEvents: 'none',
                zIndex: 10
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-32px',
                left: '-4px',
                background: '#00e5ff',
                color: '#000',
                padding: '4px 10px',
                borderRadius: '4px 4px 0 0',
                fontWeight: 'bold',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                {emotionData.emotion || 'DETECTING'}
              </div>
            </div>
          )}
        </div>
        
        <div className="emotion-display">
          <p className="status">{emotionData.emoji}<br/>{emotionData.status}</p>
          <p className="quote">"{emotionData.quote}"</p>
        </div>
      </div>
    </div>
  );
}

export default App;
