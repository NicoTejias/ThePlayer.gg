export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    username: string | null
                    role: 'player' | 'store' | 'admin' | null
                    region: string | null
                    pwp: number
                    matches_won: number
                    matches_lost: number
                    matches_drew: number
                    avatar_url: string | null
                    first_name: string | null
                    last_name: string | null
                    birth_date: string | null
                    gender: string | null
                    phone: string | null
                    address: string | null
                    country: string | null
                    city: string | null
                    preferred_games: string[] | null
                    favorite_format: string | null
                    team: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    username?: string | null
                    role?: 'player' | 'store' | 'admin' | null
                    region?: string | null
                    pwp?: number
                    matches_won?: number
                    matches_lost?: number
                    matches_drew?: number
                    avatar_url?: string | null
                    first_name?: string | null
                    last_name?: string | null
                    birth_date?: string | null
                    gender?: string | null
                    phone?: string | null
                    address?: string | null
                    country?: string | null
                    city?: string | null
                    preferred_games?: string[] | null
                    favorite_format?: string | null
                    team?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    username?: string | null
                    role?: 'player' | 'store' | 'admin' | null
                    region?: string | null
                    pwp?: number
                    matches_won?: number
                    matches_lost?: number
                    matches_drew?: number
                    avatar_url?: string | null
                    first_name?: string | null
                    last_name?: string | null
                    birth_date?: string | null
                    gender?: string | null
                    phone?: string | null
                    address?: string | null
                    country?: string | null
                    city?: string | null
                    preferred_games?: string[] | null
                    favorite_format?: string | null
                    team?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            tournaments: {
                Row: {
                    id: string
                    name: string
                    date: string
                    organizer_id: string | null
                    store_name: string | null
                    format: string | null
                    player_count: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    date: string
                    organizer_id?: string | null
                    store_name?: string | null
                    format?: string | null
                    player_count?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    date?: string
                    organizer_id?: string | null
                    store_name?: string | null
                    format?: string | null
                    player_count?: number | null
                    created_at?: string
                }
            }
            tournament_results: {
                Row: {
                    id: string
                    tournament_id: string
                    player_id: string | null
                    player_name: string
                    wins: number
                    losses: number
                    draws: number
                    pwp_earned: number
                    rank: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    tournament_id: string
                    player_id?: string | null
                    player_name: string
                    wins?: number
                    losses?: number
                    draws?: number
                    pwp_earned?: number
                    rank?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    tournament_id?: string
                    player_id?: string | null
                    player_name?: string
                    wins?: number
                    losses?: number
                    draws?: number
                    pwp_earned?: number
                    rank?: number | null
                    created_at?: string
                }
            }
        }
    }
}
