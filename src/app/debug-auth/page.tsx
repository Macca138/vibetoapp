'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function DebugAuthPage() {
  const { data: session, status } = useSession();
  const [testResult, setTestResult] = useState<string>('');

  const testCredentialsSignin = async () => {
    setTestResult('Testing...');
    
    try {
      const result = await signIn('credentials', {
        email: 'testuser@example.com',
        password: 'testpassword123',
        redirect: false,
      });
      
      setTestResult(`Result: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      setTestResult(`Error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-white">Authentication Debug Page</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Session Status</h2>
            <p className="text-gray-300">Status: <span className="font-mono text-yellow-400">{status}</span></p>
            <pre className="bg-gray-700 text-green-400 p-4 rounded mt-2 text-sm overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">Test Credentials Signin</h2>
            <button
              onClick={testCredentialsSignin}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Test Signin
            </button>
            {testResult && (
              <pre className="bg-gray-700 text-yellow-400 p-4 rounded mt-2 text-sm overflow-auto">
                {testResult}
              </pre>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white">Actions</h2>
            <div className="space-x-2">
              <button
                onClick={() => signIn()}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Sign In
              </button>
              <button
                onClick={() => signOut()}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}