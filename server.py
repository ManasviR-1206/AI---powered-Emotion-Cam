from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import base64
import numpy as np
from deepface import DeepFace

app = Flask(__name__)
CORS(app)

# Map emotion to emoji and quote
emotion_map = {
    "happy": ("😊", "You look great when you smile!"),
    "sad": ("😢", "It's okay to feel low. Brighter days are ahead."),
    "angry": ("😠", "Take a deep breath and relax."),
    "neutral": ("😐", "Keep going steady."),
    "surprise": ("😲", "Something exciting happened!"),
}

# Load Haar cascade
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    if not data or 'image' not in data:
        return jsonify({"error": "No image provided"}), 400

    # Decode base64 image
    img_data = data['image']
    if "," in img_data:
        img_data = img_data.split(",")[1]
    
    try:
        decoded_data = base64.b64decode(img_data)
        np_arr = np.frombuffer(decoded_data, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
        
        if len(faces) > 0:
            # Sort faces by area (w*h) and pick the largest one
            faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
            x, y, w, h = faces[0]
            face_roi = img[y:y+h, x:x+w]
            
            # Run deepface on the ROI (strictly skip secondary detection to be blazingly fast)
            result = DeepFace.analyze(face_roi, actions=['emotion'], enforce_detection=False, detector_backend='skip')[0]
            
            # Remove 'fear' emotion from the probabilities
            if 'fear' in result['emotion']:
                del result['emotion']['fear']
            
            # Recalculate dominant emotion without fear
            emotion = max(result['emotion'], key=result['emotion'].get)
            
            emoji, quote = emotion_map.get(emotion, ("🙂", "Emotion detected."))
            
            h_img, w_img = img.shape[:2]
            return jsonify({
                "emotion": emotion,
                "emoji": emoji,
                "quote": quote,
                "box": {"x": int(x), "y": int(y), "w": int(w), "h": int(h)},
                "imageSize": {"width": w_img, "height": h_img}
            })
        else:
            return jsonify({
                "emotion": "None",
                "emoji": "🧐",
                "quote": "No face detected. Please look at the camera.",
                "box": None
            })
            
    except Exception as e:
        print(f"Error during analysis: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting Emotion Detection Server on port 5000...")
    app.run(port=5000, debug=True)
