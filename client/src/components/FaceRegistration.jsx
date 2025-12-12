import { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import api from '../api/axios';

const FaceRegistration = () => {
    const videoRef = useRef();
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');

    // 1. Load AI Models
    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);
            setIsLoading(false);
        };
        loadModels();
    }, []);

    // 2. Start Camera
    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => { videoRef.current.srcObject = stream; })
            .catch(err => console.error(err));
    };

    

    // 3. Capture & Save Face
    const handleRegister = async () => {
        if (!videoRef.current) return;
        setMessage('Scanning face...');

        // Detect face in the video stream
        const detection = await faceapi.detectSingleFace(videoRef.current)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            setMessage('No face detected. Please look at the camera.');
            return;
        }

        // Send descriptor (array of numbers) to backend
        try {
            const descriptorArray = Array.from(detection.descriptor); // Convert Float32Array to normal Array
            await api.put('/auth/register-face', { faceDescriptor: descriptorArray });
            setMessage('Success! Face ID registered.');
        } catch (error) {
            setMessage('Failed to save face data.');
        }
    };

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <h2>Face Registration</h2>
            {isLoading ? <p>Loading AI models...</p> : (
                <>
                    <div style={{ margin: '20px auto', width: '320px', height: '240px', background: '#000', borderRadius: '10px', overflow: 'hidden' }}>
                        <video ref={videoRef} autoPlay muted style={{ width: '100%', height: '100%' }} />
                    </div>
                    <button onClick={startVideo} style={{ marginRight: '10px' }}>Start Camera</button>
                    <button onClick={handleRegister}>Register My Face</button>
                    <p>{message}</p>
                </>
            )}
        </div>
    );
};

export default FaceRegistration;