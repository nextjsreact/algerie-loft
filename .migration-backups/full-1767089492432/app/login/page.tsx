import { Suspense } from 'react';
import { LoginPageClientSimple } from '@/components/auth/login-page-client-simple';

function LoginPageContent() {
  return <LoginPageClientSimple />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}