import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

const FocusMonitor = ({ onFocusUpdate }) => {
    const videoRef = useRef();
    const [status, setStatus] = useState('Initializing...');
    const [score, setScore] = useState(100);

    // AI Loop Refs (to avoid re-renders)
    const scoreRef = useRef(100);
    const intervalRef = useRef(null);

    useEffect(() => {
        startMonitoring();
        return () => clearInterval(intervalRef.current);
    }, []);

    const startMonitoring = async () => {
        // 1. Start Camera
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;

        // 2. Start AI Loop (Check every 1 second)
        intervalRef.current = setInterval(async () => {
            if (!videoRef.current) return;

            const detection = await faceapi.detectSingleFace(videoRef.current)
                .withFaceLandmarks();

            if (!detection) {
                updateScore('No Face', -2); // Penalize heavily for leaving
                return;
            }

            // 3. Calculate Head Pose (Simple Geometry)
            const landmarks = detection.landmarks;
            const nose = landmarks.getNose()[3]; // Tip of nose
            const leftEye = landmarks.getLeftEye()[0];
            const rightEye = landmarks.getRightEye()[3];
            const jaw = landmarks.getJawOutline()[8]; // Bottom of chin

            // Calculate ratios to determine direction
            const eyeDist = rightEye.x - leftEye.x;
            const faceCenter = leftEye.x + (eyeDist / 2);
            const xOffset = nose.x - faceCenter; // Positive = Looking Right, Negative = Left
            
            const jawDist = jaw.y - nose.y; // Distance from nose to chin

            let currentStatus = 'Focused';
            let penalty = 0;

            // Thresholds (You can tune these)
            if (xOffset > eyeDist * 0.4) {
                currentStatus = 'Looking Right (Distracted)';
                penalty = -1;
            } else if (xOffset < -eyeDist * 0.4) {
                currentStatus = 'Looking Left (Distracted)';
                penalty = -1;
            } else if (jawDist < eyeDist * 0.8) { 
                currentStatus = 'Looking Down (Drowsy/Phone)';
                penalty = -2;
            } else {
                currentStatus = 'Focused ✅';
                penalty = 0.5; // Slowly recover score if focused
            }

            updateScore(currentStatus, penalty);

        }, 1000); // Run every 1 second
    };

    const updateScore = (newStatus, change) => {
        let newScore = scoreRef.current + change;
        if (newScore > 100) newScore = 100;
        if (newScore < 0) newScore = 0;

        scoreRef.current = newScore;
        setStatus(newStatus);
        setScore(Math.round(newScore));

        // Send data back to parent
        if (onFocusUpdate) onFocusUpdate({ status: newStatus, score: Math.round(newScore) });
    };

    return (
        <div style={{ background: '#000', color: 'white', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>AI Focus Monitor</h3>
            <div style={{ position: 'relative', width: '200px', height: '150px', margin: '0 auto' }}>
                <video ref={videoRef} autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                <div style={{ 
                    position: 'absolute', bottom: 5, left: 5, right: 5, 
                    background: 'rgba(0,0,0,0.7)', fontSize: '12px', padding: '5px' 
                }}>
                    {status}
                </div>
            </div>
            
            <div style={{ marginTop: '10px' }}>
                <span>Focus Score: </span>
                <span style={{ 
                    fontWeight: 'bold', 
                    color: score > 80 ? '#2ecc71' : score > 50 ? '#f1c40f' : '#e74c3c' 
                }}>
                    {score}%
                </span>
            </div>
            <div style={{ width: '100%', background: '#333', height: '5px', marginTop: '5px', borderRadius: '3px' }}>
                <div style={{ 
                    width: `${score}%`, 
                    background: score > 80 ? '#2ecc71' : score > 50 ? '#f1c40f' : '#e74c3c', 
                    height: '100%', borderRadius: '3px', transition: 'width 0.5s'
                }}></div>
            </div>
        </div>
    );
};

export default FocusMonitor;