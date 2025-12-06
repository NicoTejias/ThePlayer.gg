
export interface PlayerProfile {
  id: string;
  name: string;
  region: string;
  pwp: number;
  matchesWon: number;
  matchesLost: number;
  matchesDrew: number;
  winRate?: number; // Optional, can be calculated
}

// FIX: Add RankingEntry and WinRateRankingEntry types used in HomePage.tsx
export interface RankingEntry {
  rank: number;
  playerName: string;
  pwp: number;
  region: string;
}

export interface WinRateRankingEntry {
  rank: number;
  playerName: string;
  winRate: string;
  region: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  date: string;
  storeName: string;
  format: string;
  playerCount: number;
  imageUrl?: string;
}

export interface MediaArticle {
  id: string;
  title:string;
  author: string;
  excerpt: string;
  imageUrl: string;
  category: string;
}

export interface MediaVideo {
  id: string;
  title: string;
  channel: string;
  youtubeId: string;
  thumbnailUrl: string;
  category: string;
}

export interface MarketplacePost {
  id: string;
  title: string;
  type: 'Venta' | 'Compra' | 'Cambio';
  seller: string;
  price?: number;
  region: string;
  imageUrl: string;
}

export interface Judge {
  id: string;
  name: string;
  level: 'L1' | 'L2' | 'L3';
  region: string;
  status: 'Activo' | 'Inactivo';
}

export interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  type: 'Documento' | 'Guía' | 'Video';
  url: string;
}

export interface Store {
  id: string;
  name: string;
  region: string;
  address: string;
  website: string;
  logoUrl: string;
  status: 'Aprobada' | 'Suspendida' | 'Pendiente';
  requestDate: string;
}

export interface PlayerTournamentRecord {
    id: string;
    tournamentName: string;
    date: string;
    format: string;
    result: string; // e.g., "3-1-0"
    pointsEarned: number;
}

export interface TournamentParseResult {
  playerName: string;
  matchRecord: string; // "W-L-D"
  wins: number;
  losses: number;
  draws: number;
  pwpEarned: number;
}

export interface TournamentResult {
  id: string;
  name: string;
  date: string;
  storeName: string;
  format: string;
  playerCount: number;
}

export interface TournamentStanding {
  rank: number;
  playerName: string;
  matchRecord: string; // "W-L-D"
  pwpEarned: number;
}
