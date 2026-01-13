import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <header className="bg-dark-800 border-b border-dark-700">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-500">Promptetheus</h1>
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
        <div className="card p-8 text-center">
          <p className="text-gray-400 text-lg">
            Welcome to Promptetheus! 🔥
          </p>
          <p className="text-gray-500 mt-2">
            Project management UI coming in Sprint 6
          </p>
        </div>
      </main>
    </div>
  );
}
