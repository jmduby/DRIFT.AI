import { redirect } from 'next/navigation';
import Dashboard from '@/app/_components/Dashboard';

export default function Root() {
  const isNewNavEnabled = process.env.NEXT_PUBLIC_NEW_NAV === '1';
  
  if (isNewNavEnabled) {
    // In new nav mode, render dashboard directly at home
    return <Dashboard />;
  }
  
  // Legacy behavior: redirect to /dashboard
  redirect('/dashboard');
}