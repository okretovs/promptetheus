import { useState } from 'react';
import { authApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { deriveKey } from '../services/crypto';
import { useNavigate } from 'react-router-dom';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export function AuthForm({ mode }: AuthFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth, setEncryptionKey } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = mode === 'login'
        ? await authApi.login(username, password)
        : await authApi.register(username, password);

      const { token, encryptionSalt } = response.data;

      // Store auth data
      setAuth(token, encryptionSalt);

      // Derive encryption key from password + salt
      const key = await deriveKey(password, encryptionSalt);
      setEncryptionKey(key);

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="username" className="block text-sm font-medium mb-1">
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input"
          required
          autoComplete="username"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          required
          minLength={8}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
        {mode === 'register' && (
          <p className="text-xs text-gray-400 mt-1">
            Minimum 8 characters
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? 'Loading...' : mode === 'login' ? 'Login' : 'Register'}
      </button>
    </form>
  );
}
