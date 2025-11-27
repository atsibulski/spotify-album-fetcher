'use client';

import { useState, useRef, useEffect } from 'react';
import { useUserAuth } from '@/hooks/useUserAuth';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UserMenu() {
  const { user, isAuthenticated, logout } = useUserAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
    router.push('/settings');
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {user.imageUrl ? (
          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-green-500">
            <Image
              src={user.imageUrl}
              alt={user.displayName || 'User'}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold border-2 border-green-500">
            {user.displayName?.[0]?.toUpperCase() || user.spotifyId[0]?.toUpperCase() || 'U'}
          </div>
        )}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-900 rounded-lg shadow-xl border border-gray-800 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-white font-semibold text-sm truncate">
              {user.displayName || 'User'}
            </p>
            {user.email && (
              <p className="text-gray-400 text-xs truncate mt-1">{user.email}</p>
            )}
            <div className="mt-2 pt-2 border-t border-gray-800">
              <p className="text-gray-500 text-xs mb-1">Profile URL:</p>
              <div className="flex items-center gap-2">
                <code className="text-green-400 text-xs truncate flex-1">
                  {typeof window !== 'undefined' ? `${window.location.origin}/${user.spotifyId}` : `/${user.spotifyId}`}
                </code>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const url = typeof window !== 'undefined' ? `${window.location.origin}/${user.spotifyId}` : `/${user.spotifyId}`;
                    navigator.clipboard.writeText(url).then(() => {
                      // Show brief feedback
                      const btn = e.currentTarget;
                      const originalHTML = btn.innerHTML;
                      btn.innerHTML = '✓';
                      setTimeout(() => {
                        btn.innerHTML = originalHTML;
                      }, 1000);
                    });
                  }}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                  title="Copy profile URL"
                >
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              href={`/${user.spotifyId}`}
              className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 transition-colors flex items-center gap-3 text-sm"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Profile
            </Link>

            <button
              onClick={handleSettingsClick}
              className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 transition-colors flex items-center gap-3 text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Account Settings
            </button>

            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-800 transition-colors flex items-center gap-3 text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

