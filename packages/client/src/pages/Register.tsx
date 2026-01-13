import { Link } from 'react-router-dom';
import { AuthForm } from '../components/AuthForm';

export function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
      <div className="card p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-500 mb-2">
            Promptetheus
          </h1>
          <p className="text-gray-400">Forge fire into every prompt</p>
        </div>

        <h2 className="text-2xl font-semibold mb-6">Register</h2>

        <AuthForm mode="register" />

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-500 hover:text-primary-400">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
