-- Migration: Add game_type to profiles table
-- This enables filtering players by the game they play

-- Add game_type column with default value 'mtg'
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS game_type TEXT DEFAULT 'mtg';

-- Add check constraint to ensure valid game types
ALTER TABLE profiles
ADD CONSTRAINT valid_game_type CHECK (
  game_type IN (
    'mtg', 
    'pokemon', 
    'one_piece', 
    'lorcana', 
    'flesh_and_blood', 
    'yugioh', 
    'star_wars', 
    'board_game', 
    'rpg', 
    'warhammer', 
    'other'
  )
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_game_type ON profiles(game_type);

-- Optional: Update existing players based on their tournament history
-- This query finds the most common game type for each player based on tournaments
UPDATE profiles p
SET game_type = (
  SELECT t.game_type
  FROM tournament_results tr
  JOIN tournaments t ON tr.tournament_id = t.id
  WHERE tr.player_id = p.id
  GROUP BY t.game_type
  ORDER BY COUNT(*) DESC
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 
  FROM tournament_results tr 
  WHERE tr.player_id = p.id
);

-- Comment explaining the migration
COMMENT ON COLUMN profiles.game_type IS 'Primary game type that the player participates in. Used for filtering rankings and leaderboards.';
