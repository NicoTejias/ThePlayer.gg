

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
  matchesWon?: number;
  matches_won?: number;
  matchesLost?: number;
  matches_lost?: number;
  matchesDrew?: number;
  matches_drew?: number;
  winRate?: number;
  win_rate?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  teamId?: string;
  team?: string; // Legacy text field (still used for display if teamId is null)
  teamData?: Team; // Formal team entity
  isPublic?: boolean;
  is_pro?: boolean;
  is_content_creator?: boolean; // Content creator status
  game_type?: GameType;
  tournaments_played?: number; // Number of tournaments the player has participated in
}

// FIX: Add RankingEntry type used in HomePage.tsx
export interface RankingEntry {
  rank: number;
  playerName: string;
  pwp: number;
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
  description?: string; // Descripción del evento
  isUserRegistered?: boolean; // Si el usuario actual está inscrito
  gameType?: GameType;
  entryFee?: string; // Valor de la entrada
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
  is_premium?: boolean;
}

export interface MediaVideo {
  id: string;
  title: string;
  channel: string;
  youtubeId: string;
  thumbnailUrl: string;
  category: string;
  is_premium?: boolean;
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



export interface TournamentParseResult {
  rank?: number;
  playerName: string;
  matchRecord?: string; // "W-L-D"
  wins?: number;
  losses?: number;
  draws?: number;
  pwpEarned: number;
}

export type GameType = 'mtg' | 'pokemon' | 'one_piece' | 'lorcana' | 'flesh_blood' | 'yugioh' | 'star_wars' | 'board_game' | 'rpg' | 'warhammer' | 'digimon' | 'other';

export const GAME_LABELS: Record<GameType, string> = {
  mtg: 'Magic: The Gathering',
  pokemon: 'Pokémon TCG',
  one_piece: 'One Piece TCG',
  lorcana: 'Disney Lorcana',
  flesh_blood: 'Flesh and Blood',
  yugioh: 'Yu-Gi-Oh!',
  star_wars: 'Star Wars Unlimited',
  board_game: 'Juegos de Mesa',
  rpg: 'Rol (RPG)',
  warhammer: 'Warhammer / Wargames',
  digimon: 'Digimon Card Game',
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
    { id: 'competitive', name: 'Competitivo', path: '/ranking' },
    { id: 'commander', name: 'Commander', path: '/commander' },
    { id: 'pauper', name: 'Pauper', path: '/pauper' },
    { id: 'premodern', name: 'Premodern', path: '/premodern' },
  ],
  pokemon: [
    { id: 'competitive', name: 'Competitivo', path: '/ranking' },
  ],
  one_piece: [
    { id: 'competitive', name: 'Competitivo', path: '/ranking' },
  ],
  lorcana: [
    { id: 'competitive', name: 'Competitivo', path: '/ranking' },
  ],
  flesh_blood: [
    { id: 'competitive', name: 'Competitivo', path: '/ranking' },
  ],
  yugioh: [
    { id: 'competitive', name: 'Competitivo', path: '/ranking' },
  ],
  star_wars: [
    { id: 'competitive', name: 'Competitivo', path: '/ranking' },
  ],
  board_game: [],
  rpg: [],
  warhammer: [],
  digimon: [],
  other: [],
};

// Game logos configuration (with fallback emojis)
export const GAME_LOGOS: Record<GameType, { src: string; emoji: string }> = {
  mtg: { src: '/images/games/mtg-logo.png', emoji: '🎴' },
  pokemon: { src: '/images/games/pokemon-logo.png', emoji: '⚡' },
  one_piece: { src: '/images/games/onepiece-logo.png', emoji: '🏴‍☠️' },
  lorcana: { src: '/images/games/lorcana-logo.png', emoji: '✨' },
  flesh_blood: { src: '/images/games/fab-logo.png', emoji: '⚔️' },
  yugioh: { src: '/images/games/yugioh-logo.png', emoji: '🃏' },
  star_wars: { src: '/images/games/starwars-logo.png', emoji: '⭐' },
  board_game: { src: '', emoji: '🎲' },
  rpg: { src: '', emoji: '🎭' },
  warhammer: { src: '', emoji: '🛡️' },
  digimon: { src: '/images/games/digimon-logo.png', emoji: '🦖' },
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
  leagueId?: string;
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
  matchRecord?: string; // "W-L-D"
  pwpEarned: number;
}

export interface Award {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  category: 'performance' | 'community' | 'special' | 'judge';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  created_at?: string;
}

export interface UserAward {
  id: string;
  user_id: string;
  award_id: string;
  season: string;
  obtained_at: string;
  comment?: string;
  award?: Award; // Relational data
}

export interface ForumCategory {
  id: string;
  name: string;
  description?: string;
  slug: string;
  ordering: number;
  created_at?: string;
  boards?: ForumBoard[];
}

export interface ForumBoard {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  slug: string;
  ordering: number;
  threads_count?: number; // Count aggregation
  created_at?: string;
}

export interface ForumThread {
  id: string;
  board_id: string;
  user_id: string;
  author_name: string;
  author_avatar_url?: string;
  title: string;
  slug: string;
  content: string;
  view_count: number;
  pinned: boolean;
  locked: boolean;
  created_at: string;
  updated_at: string;
  posts_count?: number; // Aggregation
  last_post_at?: string; // Aggregation
}

export interface ForumPost {
  id: string;
  thread_id: string;
  user_id: string;
  author_name: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_avatar_url?: string;
  author_role?: string;
}
