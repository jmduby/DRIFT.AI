import { styleFoundation } from '@/lib/flags';
import { Card, CardContent } from '@/components/ui/card';

export default function ProfilePage() {
  const isStyleFoundation = styleFoundation();

  if (isStyleFoundation) {
    return (
      <div className="px-6 py-6 md:px-8 md:py-8">
        <header className="mb-8">
          <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-text-1 mb-2">
            Profile
          </h1>
          <p className="text-sm text-text-2">
            Manage your account settings and preferences
          </p>
        </header>

        <Card>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-bg-800">
                <svg className="w-8 h-8 text-text-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-text-1 mb-2">
                Profile Settings
              </h3>
              <p className="text-text-2">
                User profile and account management coming soon.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--background-app)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-inter mb-2" style={{ color: 'var(--text-primary)' }}>
            Profile
          </h1>
          <p className="font-roboto" style={{ color: 'var(--text-secondary)' }}>
            Manage your account settings and preferences
          </p>
        </div>

        <div 
          className="rounded-xl shadow-lg p-12 text-center"
          style={{ backgroundColor: 'var(--background-surface)', borderRadius: '12px' }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
               style={{ backgroundColor: 'var(--background-surface-secondary)' }}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" 
                 style={{ color: 'var(--text-secondary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium font-inter mb-2" style={{ color: 'var(--text-primary)' }}>
            Profile Settings
          </h3>
          <p className="font-roboto" style={{ color: 'var(--text-secondary)' }}>
            User profile and account management coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}