import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import './App.css';

function App() {
  const webcamRef = useRef(null);
  const [emotionData, setEmotionData] = useState({});

  const capture = async () => {
    const imageSrc = webcamRef.current.getScreenshot();

    // Convert base64 to Blob
    const byteString = atob(imageSrc.split(',')[1]);
    const mimeString = imageSrc.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });

    const formData = new FormData();
    formData.append('image', blob, 'screenshot.jpg');

    try {
      const res = await axios.post('http://127.0.0.1:5000/detect_emotion', formData);
      setEmotionData(res.data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div className="app">
      <h1 className="title">😊 Emotion Detection Mirror</h1>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={640}
        height={480}
      />
      <button onClick={capture}>Capture Emotion</button>

      {emotionData.emotion && (
        <div className="result">
          <h2>{emotionData.emoji} {emotionData.emotion}</h2>
          <p>{emotionData.quote}</p>
        </div>
      )}
    </div>
  );
}

export default App;
