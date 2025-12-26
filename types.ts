

export interface Team {
  id: string;
  name: string;
  logoUrl?: string;
  description?: string;
  captainId?: string;
  totalPwp?: number; // Calculated field
  memberCount?: number; // Calculated field
}

export interface PlayerProfile {
  id: string;
  name: string;
  region: string;
  pwp: number;
  matchesWon: number;
  matchesLost: number;
  matchesDrew: number;
  winRate?: number;
  teamId?: string;
  team?: string; // Legacy text field (still used for display if teamId is null)
  teamData?: Team; // Formal team entity
  isPublic?: boolean;
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
  createdBy?: string; // ID del usuario que creó el evento (solo para eventos agendados)
  maxPlayers?: number; // Máximo de jugadores permitidos
  time?: string; // Hora del evento
  isUserRegistered?: boolean; // Si el usuario actual está inscrito
  gameType?: GameType;
}

export interface MediaArticle {
  id: string;
  title: string;
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

export interface MarketplaceItem {
  id: string;
  name: string;
  set?: string;
  condition?: string;
  price?: number;
  imageUrl: string;
}

export interface MarketplacePost {
  id: string;
  title: string;
  type: 'Venta' | 'Compra' | 'Cambio';
  seller: string;
  price?: number;
  region: string;
  imageUrl: string;
  items?: MarketplaceItem[];
  description?: string;
  contactInfo?: string;
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

export type GameType = 'mtg' | 'pokemon' | 'one_piece' | 'lorcana' | 'flesh_and_blood' | 'yugioh' | 'star_wars' | 'board_game' | 'rpg' | 'warhammer' | 'other';

export const GAME_LABELS: Record<GameType, string> = {
  mtg: 'Magic: The Gathering',
  pokemon: 'Pokémon TCG',
  one_piece: 'One Piece TCG',
  lorcana: 'Disney Lorcana',
  flesh_and_blood: 'Flesh and Blood',
  yugioh: 'Yu-Gi-Oh!',
  star_wars: 'Star Wars Unlimited',
  board_game: 'Juegos de Mesa',
  rpg: 'Rol (RPG)',
  warhammer: 'Warhammer / Wargames',
  other: 'Otro'
};

export interface TournamentResult {
  id: string;
  name: string;
  date: string;
  storeName: string;
  format: TournamentFormat | string;
  playerCount: number;
  gameType?: GameType;
}

export type TournamentFormat =
  | 'Standard'
  | 'Modern'
  | 'Pioneer'
  | 'Legacy'
  | 'Vintage'
  | 'Commander'
  | 'Pauper'
  | 'Limited'
  | 'Sealed'
  | 'Draft'
  | 'Pre-Release'
  | 'Store Championship'
  | 'RCQ';

export interface TournamentStanding {
  rank: number;
  playerName: string;
  matchRecord: string; // "W-L-D"
  pwpEarned: number;
}
