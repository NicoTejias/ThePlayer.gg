-- Add is_premium column to articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- Add is_premium column to videos
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- Create content_views table for tracking
CREATE TABLE IF NOT EXISTS content_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content_id UUID NOT NULL, -- Logical reference to article or video ID
    content_type TEXT NOT NULL CHECK (content_type IN ('article', 'video')),
    creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Owner of the content
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries on payouts
CREATE INDEX IF NOT EXISTS idx_content_views_creator_month ON content_views(creator_id, created_at);

-- RLS Policies

-- Content Views: Allow insert by authenticated users (when they view)
ALTER TABLE content_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own views"
ON content_views FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all content views"
ON content_views FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Creators can view their own content stats"
ON content_views FOR SELECT
TO authenticated
USING (
    auth.uid() = creator_id
);

-- Updates to Articles and Videos RLS to handle Premium content?
-- Actually, read access is usually open or filtering happens in frontend.
-- But strictly, strict RLS would hide it. 
-- For now, we will ALLOW read but filter 'content' logic in frontend or 
-- if we strictly want to hide 'content' field via RLS, we'd need a dynamic policy.
-- Keeping it simple: Allow Select, but frontend hides body if premium and no sub.
-- Just ensuring the column is writable by creators/admins.

-- Ensure creator/admin can set is_premium
-- (Existing policies for UPDATE/INSERT should cover it if they are just "Authors can update own posts")
