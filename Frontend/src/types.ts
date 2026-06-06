export interface Track {
  id: string;
  title: string;
  artist: string;
  artistHandle: string;
  cover: string;
  duration: number; // seconds
  plays: string;
  priceUSDC: number;
  genre: string;
  quality?: 'LOSSLESS' | 'HQ' | 'STANDARD';
  kbps?: number;
  isNew?: boolean;
  isFeatured?: boolean;
  ipfs_audio_hash?: string;
}

export interface Album {
  id: string;
  title: string;
  volume: string;
  cover: string;
  trackCount: number;
  year: number;
}

export interface QueueTrack {
  id: string;
  title: string;
  artist: string;
  cover: string;
  duration: number;
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  provider: 'phantom' | 'solflare' | null;
  balances: {
    SOL: number;
    USDC: number;
    USDT: number;
  };
  ancBalance: number;
  ancUSD: number;
}

export interface PlayerState {
  track: Track | null;
  isPlaying: boolean;
  progress: number; // 0–1
  volume: number;   // 0–1
  shuffle: boolean;
  repeat: boolean;
}
