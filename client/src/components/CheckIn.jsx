import { useState } from 'react';
import api from '../api/axios.js';

function CheckIn() {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'loading'
  const [isLoading, setIsLoading] = useState(false);
  
  // This is the classId from Step 2 of your backend testing
  const CLASS_ID = '6915f1bca28c566d24b63cbb'; 

  const handleCheckIn = () => {
    setIsLoading(true);
    setMessage('Getting your location...');
    setMessageType('loading');

    if (!navigator.geolocation) {
      setMessage('Geolocation is not supported by your browser.');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMessage('Location found! Checking in...');
        setMessageType('loading');

        try {
          const response = await api.post('/attendance/check-in', {
            classId: CLASS_ID,
            studentLat: latitude,
            studentLon: longitude,
          });
          
          setMessage(`Success: ${response.data.message}`);
          setMessageType('success');

        } catch (error) {
          setMessage(`Error: ${error.response.data.message}`);
          setMessageType('error');
        } finally {
          setIsLoading(false);
        }
      },
      () => {
        setMessage('Unable to retrieve your location. Please enable location services.');
        setMessageType('error');
        setIsLoading(false);
      }
    );
  };

  return (
    <div className="check-in-container">
      <h2>Attendance Check-in</h2>
      <p>Press the button to mark your attendance using your location.</p>
      
      {/* This will show the message box only if 'message' is not empty.
        It adds the class 'success', 'error', or 'loading'
      */}
      <div className={`message ${messageType} ${message ? 'show' : ''}`}>
        {message}
      </div>

      <button onClick={handleCheckIn} disabled={isLoading} className="primary-btn">
        {isLoading ? 'Checking...' : '📍 Mark My Attendance'}
      </button>
    </div>
  );
}

export default CheckIn;