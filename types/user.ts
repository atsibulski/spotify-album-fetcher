export interface User {
  id: string;
  spotifyId: string;
  email: string | null;
  displayName: string | null;
  imageUrl: string | null;
  spotifyAccessToken: string;
  spotifyRefreshToken: string;
  tokenExpiresAt: number;
  createdAt: number;
  updatedAt: number;
  preferences: {
    theme: 'dark' | 'light' | 'auto';
    defaultView: 'grid' | 'list';
    autoPlay: boolean;
  };
}

export interface UserSession {
  userId: string;
  spotifyId: string;
  email: string | null;
  displayName: string | null;
  imageUrl: string | null;
}

