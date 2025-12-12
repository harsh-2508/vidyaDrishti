import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import * as faceapi from 'face-api.js';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import './StudentDashboard.css'; // Re-use styles
import { FaArrowLeft } from 'react-icons/fa'; // Icon for back button

const Profile = () => {
    const { user } = useAuth();
    const videoRef = useRef();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [modelsLoaded, setModelsLoaded] = useState(false);

    // 1. Load Models
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
            } catch (err) {
                console.error("Model load error:", err);
                setMessage("Error loading AI models. Check public/models folder.");
            }
        };
        loadModels();
    }, []);

    // 2. Start Camera
    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => { 
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch(err => setMessage("Camera permission denied"));
    };

    // 3. Register Face
    const handleRegister = async () => {
        if (!videoRef.current) return;
        setIsLoading(true);
        setMessage('Scanning face...');

        try {
            const detection = await faceapi.detectSingleFace(videoRef.current)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                setMessage('No face detected. Please look clearly at the camera.');
                setIsLoading(false);
                return;
            }

            const descriptorArray = Array.from(detection.descriptor); 

            await api.put('/auth/register-face', { faceDescriptor: descriptorArray });
            
            setMessage('✅ Success! Your face is registered.');
            
            const stream = videoRef.current.srcObject;
            if(stream) stream.getTracks().forEach(track => track.stop());

        } catch (error) {
            console.error(error);
            setMessage('❌ Failed to save face data.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            {/* Simple Sidebar Placeholder or just Main Content */}
            <div className="main-content" style={{marginLeft: 0, width: '100%', padding: '40px'}}>
                
                {/* Back Button */}
                <Link to="/check-in" style={{
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    textDecoration: 'none', 
                    color: '#3498db', 
                    fontWeight: 'bold',
                    marginBottom: '20px'
                }}>
                    <FaArrowLeft /> Back to Dashboard
                </Link>

                <div className="attendance-portal" style={{maxWidth: '600px', margin: '0 auto'}}>
                    <div className="user-info" style={{justifyContent: 'center', margin: '20px 0'}}>
                        <div className="user-avatar" style={{width: '80px', height: '80px', fontSize: '30px'}}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <h2 style={{textAlign: 'center'}}>{user?.name}</h2>
                    <p style={{textAlign: 'center', color: '#777'}}>{user?.email}</p>

                    <hr style={{margin: '30px 0', border: '0', borderTop: '1px solid #eee'}} />

                    <h3 style={{textAlign: 'center'}}>Register Face ID</h3>
                    <p style={{textAlign: 'center', color: '#555', fontSize: '14px', marginBottom: '20px'}}>
                        Look at the camera to register your face for attendance.
                    </p>

                    <div className="camera-container" style={{margin: '0 auto', background: '#000'}}>
                        {!modelsLoaded && <p style={{color: 'white', paddingTop: '100px', textAlign:'center'}}>Loading AI...</p>}
                        <video ref={videoRef} autoPlay muted playsInline style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    </div>

                    <div style={{textAlign: 'center', gap: '10px', display: 'flex', justifyContent: 'center', marginTop: '20px'}}>
                        <button className="btn-attendance" onClick={startVideo} disabled={!modelsLoaded} style={{marginTop:0}}>
                            Start Camera
                        </button>
                        <button className="btn-attendance" onClick={handleRegister} disabled={isLoading || !modelsLoaded} style={{background: '#27ae60', marginTop:0}}>
                            {isLoading ? 'Scanning...' : 'Save Face'}
                        </button>
                    </div>
                    
                    {message && <p style={{textAlign: 'center', marginTop: '15px', fontWeight: 'bold'}}>{message}</p>}
                </div>
            </div>
        </div>
    );
};

export default Profile;