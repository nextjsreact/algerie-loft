import { LoginForm } from '@/components/auth/login-form';

export default function EmployeeLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">🏢 Connexion Employé</h1>
          <p className="text-gray-600">Accédez à votre espace de travail</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}