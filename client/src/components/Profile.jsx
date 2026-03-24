import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom'; 
import * as faceapi from 'face-api.js';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import './StudentDashboard.css'; 

const Profile = () => {
    const { user } = useAuth();
    const videoRef = useRef();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [modelsLoaded, setModelsLoaded] = useState(false);

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            try {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setModelsLoaded(true);
            } catch (err) { setMessage("Error loading AI models."); }
        };
        loadModels();
    }, []);

    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
            .catch(err => setMessage("Camera permission denied"));
    };

    const handleRegister = async () => {
        if (!videoRef.current) return;
        setIsLoading(true); setMessage('Scanning...');
        try {
            const detection = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();
            if (!detection) { setMessage('No face detected.'); setIsLoading(false); return; }

            const descriptorArray = Array.from(detection.descriptor); 
            await api.put('/auth/register-face', { faceDescriptor: descriptorArray });
            setMessage('✅ Face registered successfully.');
        } catch (error) { setMessage('❌ Failed to save data.'); } 
        finally { setIsLoading(false); }
    };

    return (
        <div className="dashboard-container" style={{display:'flex', justifyContent:'center', padding:'20px'}}>
            <div className="attendance-portal" style={{maxWidth: '500px', width:'100%'}}>
                <Link to="/check-in" style={{textDecoration: 'none', color: '#3498db', fontWeight: 'bold'}}>← Back</Link>
                <h2 style={{textAlign: 'center'}}>{user?.name}</h2>
                <h3 style={{textAlign: 'center'}}>Face Registration</h3>
                
                <div style={{background: '#000', width:'100%', height:'300px', borderRadius:'10px', overflow:'hidden', margin:'20px 0'}}>
                     {!modelsLoaded && <p style={{color:'white', textAlign:'center', paddingTop:'140px'}}>Loading AI...</p>}
                     <video ref={videoRef} autoPlay muted playsInline style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                </div>

                <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
                    <button className="btn-attendance" onClick={startVideo} disabled={!modelsLoaded}>Start Camera</button>
                    <button className="btn-attendance" onClick={handleRegister} disabled={isLoading} style={{background: '#27ae60'}}>{isLoading ? 'Scanning...' : 'Save Face'}</button>
                </div>
                {message && <p style={{textAlign: 'center', marginTop: '15px', fontWeight: 'bold'}}>{message}</p>}
            </div>
        </div>
    );
};
export default Profile;