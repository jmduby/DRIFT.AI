import { styleFoundation } from '@/lib/flags';

export default function ProfilePage() {
  const isStyleFoundation = styleFoundation();

  return (
    <div className={`min-h-screen p-8 ${
      isStyleFoundation ? '' : 'bg-zinc-950 text-white'
    }`} style={!isStyleFoundation ? {} : { backgroundColor: 'var(--background-app)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${
            isStyleFoundation ? 'text-text-1 font-inter' : 'text-white font-inter'
          }`}>
            Profile
          </h1>
          <p className={`${
            isStyleFoundation ? 'text-text-2' : 'text-gray-400'
          }`}>
            Manage your account settings and preferences
          </p>
        </div>

        <div className={`rounded-2xl border p-6 ${
          isStyleFoundation 
            ? 'bg-white/3 border-white/10' 
            : 'bg-zinc-900 border-zinc-800'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 ${
            isStyleFoundation ? 'text-text-1 font-inter' : 'text-white font-inter'
          }`}>
            Account Information
          </h2>
          <div className={`text-center py-12 ${
            isStyleFoundation ? 'text-text-2' : 'text-gray-400'
          }`}>
            <p>Profile settings coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}