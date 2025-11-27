'use client';

import { useState, useEffect } from 'react';
import { useUserAuth } from '@/hooks/useUserAuth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import UserMenu from '@/components/UserMenu';

export default function SettingsPage() {
  const { user, loading, updateUser, logout } = useUserAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [preferences, setPreferences] = useState({
    theme: 'dark' as 'dark' | 'light' | 'auto',
    defaultView: 'grid' as 'grid' | 'list',
    autoPlay: false,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPreferences(user.preferences);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await updateUser({
        displayName: displayName.trim() || null,
        preferences,
      });
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-900 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center text-white">Loading...</div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-900 p-4 md:p-8 pb-24">
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-green-400 hover:text-green-300 flex items-center gap-2 text-sm md:text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-white">Account Settings</h1>
          <UserMenu />
        </div>
      </div>

      <div className="max-w-2xl mx-auto pt-20">
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Account Settings</h2>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-2xl border border-gray-800">
          {/* Profile Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Profile</h2>
            <div className="flex items-center gap-6 mb-6">
              {user.imageUrl ? (
                <div className="relative w-24 h-24 rounded-full overflow-hidden">
                  <Image
                    src={user.imageUrl}
                    alt={user.displayName || 'User'}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-3xl text-gray-400">
                  {user.displayName?.[0]?.toUpperCase() || user.spotifyId[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <p className="text-white font-semibold text-lg">{user.displayName || 'User'}</p>
                <p className="text-gray-400 text-sm">{user.email || 'No email'}</p>
                <p className="text-gray-500 text-xs mt-1">Spotify ID: {user.spotifyId}</p>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="displayName" className="block text-white font-semibold mb-2">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Preferences Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Preferences</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">Theme</label>
                <select
                  value={preferences.theme}
                  onChange={(e) => setPreferences({ ...preferences, theme: e.target.value as 'dark' | 'light' | 'auto' })}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="auto">Auto</option>
                </select>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">Default View</label>
                <select
                  value={preferences.defaultView}
                  onChange={(e) => setPreferences({ ...preferences, defaultView: e.target.value as 'grid' | 'list' })}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="grid">Grid</option>
                  <option value="list">List</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoPlay"
                  checked={preferences.autoPlay}
                  onChange={(e) => setPreferences({ ...preferences, autoPlay: e.target.checked })}
                  className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-green-500 focus:ring-2 focus:ring-green-500"
                />
                <label htmlFor="autoPlay" className="text-white font-semibold">
                  Auto-play tracks
                </label>
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-4 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={logout}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

