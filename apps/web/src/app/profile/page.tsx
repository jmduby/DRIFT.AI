import { styleFoundation } from '@/lib/flags';

export default function ProfilePage() {
  const isStyleFoundation = styleFoundation();

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--background-app)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold font-inter mb-2 ${
            isStyleFoundation ? 'text-text-1' : 'text-[var(--text-primary)]'
          }`}>
            Profile
          </h1>
          <p className={`font-roboto ${
            isStyleFoundation ? 'text-text-2' : 'text-[var(--text-secondary)]'
          }`}>
            Manage your account settings and preferences
          </p>
        </div>

        <div className={`rounded-xl shadow-lg p-12 text-center ${
          isStyleFoundation 
            ? 'bg-white/3 border-white/10 border' 
            : ''
        }`} style={!isStyleFoundation ? { 
          backgroundColor: 'var(--background-surface)', 
          borderRadius: '12px' 
        } : {}}>
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            isStyleFoundation ? 'bg-bg-800' : ''
          }`} style={!isStyleFoundation ? { 
            backgroundColor: 'var(--background-surface-secondary)' 
          } : {}}>
            <svg className={`w-8 h-8 ${
              isStyleFoundation ? 'text-text-3' : ''
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" 
                 style={!isStyleFoundation ? { color: 'var(--text-secondary)' } : {}}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className={`text-lg font-medium font-inter mb-2 ${
            isStyleFoundation ? 'text-text-1' : ''
          }`} style={!isStyleFoundation ? { color: 'var(--text-primary)' } : {}}>
            Profile Settings
          </h3>
          <p className={`font-roboto ${
            isStyleFoundation ? 'text-text-2' : ''
          }`} style={!isStyleFoundation ? { color: 'var(--text-secondary)' } : {}}>
            User profile and account management coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}