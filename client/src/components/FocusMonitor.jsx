import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

const FocusMonitor = ({ onFocusUpdate }) => {
    const videoRef = useRef();
    const [status, setStatus] = useState('Initializing...');
    const [score, setScore] = useState(100);
    const scoreRef = useRef(100);
    const intervalRef = useRef(null);

    useEffect(() => {
        startMonitoring();
        return () => clearInterval(intervalRef.current);
    }, []);

    const startMonitoring = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;

        intervalRef.current = setInterval(async () => {
            if (!videoRef.current) return;
            const detection = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks();

            if (!detection) { updateScore('No Face', -2); return; }

            const landmarks = detection.landmarks;
            const nose = landmarks.getNose()[3]; 
            const leftEye = landmarks.getLeftEye()[0];
            const rightEye = landmarks.getRightEye()[3];
            const jaw = landmarks.getJawOutline()[8]; 

            const eyeDist = rightEye.x - leftEye.x;
            const faceCenter = leftEye.x + (eyeDist / 2);
            const xOffset = nose.x - faceCenter; 
            const jawDist = jaw.y - nose.y; 

            let currentStatus = 'Focused';
            let penalty = 0.5;

            if (xOffset > eyeDist * 0.4) { currentStatus = 'Looking Right'; penalty = -1; } 
            else if (xOffset < -eyeDist * 0.4) { currentStatus = 'Looking Left'; penalty = -1; } 
            else if (jawDist < eyeDist * 0.8) { currentStatus = 'Looking Down'; penalty = -2; } 
            else { currentStatus = 'Focused ✅'; }

            updateScore(currentStatus, penalty);
        }, 1000); 
    };

    const updateScore = (newStatus, change) => {
        let newScore = scoreRef.current + change;
        if (newScore > 100) newScore = 100;
        if (newScore < 0) newScore = 0;
        scoreRef.current = newScore;
        setStatus(newStatus);
        setScore(Math.round(newScore));
        if (onFocusUpdate) onFocusUpdate({ status: newStatus, score: Math.round(newScore) });
    };

    return (
        <div style={{ background: '#000', color: 'white', padding: '10px', borderRadius: '8px', textAlign: 'center', width:'300px' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>AI Focus Monitor</h3>
            <div style={{ position: 'relative', width: '200px', height: '150px', margin: '0 auto' }}>
                <video ref={videoRef} autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                <div style={{ position: 'absolute', bottom: 5, left: 5, right: 5, background: 'rgba(0,0,0,0.7)', fontSize: '12px' }}>{status}</div>
            </div>
            <div style={{ marginTop: '10px' }}>
                <span>Focus Score: </span><span style={{ fontWeight: 'bold', color: score > 80 ? '#2ecc71' : score > 50 ? '#f1c40f' : '#e74c3c' }}>{score}%</span>
            </div>
        </div>
    );
};
export default FocusMonitor;