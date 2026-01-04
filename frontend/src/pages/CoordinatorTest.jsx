// Quick Test Component - Add this temporarily to test the API
// Place in: frontend/src/pages/CoordinatorTest.jsx

import { useState } from 'react';
import { hackathonAPI } from '../services/api';
import Button from '../components/ui/Button';

export default function CoordinatorTest() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testAPI = async () => {
    // Replace with your actual hackathon ID
    const hackathonId = 'YOUR_HACKATHON_ID_HERE';
    
    console.log('Testing API call...');
    console.log('Hackathon ID:', hackathonId);
    console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
    
    try {
      const response = await hackathonAPI.getCoordinators(hackathonId);
      console.log('✅ Success:', response.data);
      setResult(JSON.stringify(response.data, null, 2));
      setError(null);
    } catch (err) {
      console.error('❌ Error:', err);
      console.error('Response:', err.response?.data);
      console.error('Status:', err.response?.status);
      setError(JSON.stringify({
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      }, null, 2));
      setResult(null);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Coordinator API Test</h1>
      
      <div className="mb-4">
        <p><strong>API Base URL:</strong> {import.meta.env.VITE_API_BASE_URL || 'Not set'}</p>
        <p><strong>Token:</strong> {localStorage.getItem('token') ? 'Present' : 'Missing'}</p>
      </div>

      <Button onClick={testAPI}>Test API Call</Button>

      {result && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
          <h2 className="font-bold text-green-800 mb-2">Success:</h2>
          <pre className="text-sm">{result}</pre>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <h2 className="font-bold text-red-800 mb-2">Error:</h2>
          <pre className="text-sm">{error}</pre>
        </div>
      )}
    </div>
  );
}

// To use:
// 1. Import in App.jsx
// 2. Add route: <Route path="/test-coordinator" element={<CoordinatorTest />} />
// 3. Navigate to /test-coordinator
// 4. Replace YOUR_HACKATHON_ID_HERE with actual ID
// 5. Click "Test API Call"