

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
  is_pro?: boolean;
  is_content_creator?: boolean; // Content creator status
  game_type?: GameType; // Primary game the player participates in
  tournaments_played?: number; // Number of tournaments the player has participated in
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
  imageUrl?: string; // Optional because Supabase might separate it or use different casing
  image_url?: string; // Add snake_case for DB compatibility if raw fetch
  category: string;
  slug?: string;
  published_at?: string;
  game_type?: string;
  content?: string;
  created_at?: string;
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

// JudgeBadge component is kept for identifying players who are judges
// The full judge system was removed pending Wizards' new judge program

export interface Store {
  id: string;
  name: string;
  region: string;
  address: string;
  website: string;
  logoUrl: string;
  status: 'Aprobada' | 'Suspendida' | 'Pendiente';
  requestDate: string;
  subscription_tier?: 'free' | 'basic' | 'medium' | 'premium';
  subscription_expires_at?: string;
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

// Game formats configuration
export interface GameFormat {
  id: string;
  name: string;
  path: string;
}

export const GAME_FORMATS: Record<GameType, GameFormat[]> = {
  mtg: [
    { id: 'competitive', name: 'Competitivo', path: '/ranking/pwp' },
    { id: 'commander', name: 'Commander', path: '/commander' },
    { id: 'pauper', name: 'Pauper', path: '/pauper' },
    { id: 'premodern', name: 'Premodern', path: '/premodern' },
  ],
  pokemon: [
    { id: 'competitive', name: 'Competitivo', path: '/ranking/pwp' },
  ],
  one_piece: [
    { id: 'competitive', name: 'Competitivo', path: '/ranking/pwp' },
  ],
  lorcana: [
    { id: 'competitive', name: 'Competitivo', path: '/ranking/pwp' },
  ],
  flesh_and_blood: [
    { id: 'competitive', name: 'Competitivo', path: '/ranking/pwp' },
  ],
  yugioh: [
    { id: 'competitive', name: 'Competitivo', path: '/ranking/pwp' },
  ],
  star_wars: [
    { id: 'competitive', name: 'Competitivo', path: '/ranking/pwp' },
  ],
  board_game: [],
  rpg: [],
  warhammer: [],
  other: [],
};

// Game logos configuration (with fallback emojis)
export const GAME_LOGOS: Record<GameType, { src: string; emoji: string }> = {
  mtg: { src: '/images/games/mtg-logo.png', emoji: '🎴' },
  pokemon: { src: '/images/games/pokemon-logo.png', emoji: '⚡' },
  one_piece: { src: '/images/games/onepiece-logo.png', emoji: '🏴‍☠️' },
  lorcana: { src: '/images/games/lorcana-logo.png', emoji: '✨' },
  flesh_and_blood: { src: '/images/games/fab-logo.png', emoji: '⚔️' },
  yugioh: { src: '/images/games/yugioh-logo.png', emoji: '🃏' },
  star_wars: { src: '/images/games/starwars-logo.png', emoji: '⭐' },
  board_game: { src: '', emoji: '🎲' },
  rpg: { src: '', emoji: '🎭' },
  warhammer: { src: '', emoji: '🛡️' },
  other: { src: '', emoji: '🎮' },
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
