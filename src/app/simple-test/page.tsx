'use client';

import { useEffect, useState } from 'react';

export default function SimpleTestPage() {
  const [message, setMessage] = useState('Initial state');
  
  useEffect(() => {
    setMessage('useEffect ran!');
    console.log('SimpleTestPage: useEffect executed');
  }, []);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Simple Test</h1>
      <p className="mt-4">{message}</p>
      <button 
        onClick={() => setMessage('Button clicked!')}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Click me
      </button>
    </div>
  );
}