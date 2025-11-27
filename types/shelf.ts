export interface Album {
  id: string;
  name: string;
  artists: string;
  images: Array<{ url: string; height: number; width: number }>;
  externalUrl: string;
  releaseDate: string;
  totalTracks: number;
  genres: string[];
  label: string;
  popularity: number;
  tracks: Array<{
    id: string;
    name: string;
    duration: number;
    trackNumber: number;
    artists: string;
    previewUrl: string | null;
    externalUrl: string;
  }>;
}

export interface Shelf {
  id: string;
  name: string;
  albums: Album[];
  createdAt: number;
}

