// Login.js
import { useState } from 'react';
import axios from 'axios';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    
    if (!email.trim()) return setError("Please enter your email");
    if (!password.trim()) return setError("Please enter your password");

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3001/auth/login', {
        email,
        password
      });

      if (res.data.user) {
        localStorage.setItem('username', res.data.user.name);
        localStorage.setItem('userEmail', res.data.user.email);
        localStorage.setItem('userId', res.data.user.id);
        onLogin(res.data.user.name);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Login</h2>

        {error && (
          <p className="text-sm text-red-600 mb-3">{error}</p>
        )}

        <label className="block mb-3 text-sm">
          <span className="text-gray-700">Email</span>
          <input 
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            className="mt-1 block w-full rounded border px-3 py-2 focus:outline-none focus:ring"
            placeholder="you@example.com"
          />
        </label>

        <label className="block mb-4 text-sm">
          <span className="text-gray-700">Password</span>
          <input 
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            className="mt-1 block w-full rounded border px-3 py-2 focus:outline-none focus:ring"
            placeholder="Enter your password"
          />
        </label>

        <button 
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
}
