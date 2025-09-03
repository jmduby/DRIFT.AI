import Dashboard from '@/app/_components/Dashboard';

export default async function DashboardPage() {
  // Dashboard page now just returns the shared Dashboard component
  // This preserves deep link compatibility while sharing the implementation
  return <Dashboard />;
}