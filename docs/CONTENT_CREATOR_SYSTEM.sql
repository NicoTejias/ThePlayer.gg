-- CONTENT CREATOR SYSTEM - Database Migration
-- This migration adds support for content creators who can publish articles and videos

-- Step 1: Add creator_status to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS creator_status TEXT DEFAULT NULL
CHECK (creator_status IN ('pending', 'approved', 'rejected', 'suspended'));

-- Step 2: Create content_creator_applications table
CREATE TABLE IF NOT EXISTS content_creator_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    portfolio_url TEXT,
    social_media_links JSONB DEFAULT '{}'::jsonb, -- {youtube, instagram, twitter, twitch}
    content_type TEXT[] DEFAULT ARRAY['articles'], -- articles, videos, or both
    sample_work_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    motivation TEXT NOT NULL,
    experience TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES profiles(id),
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Add creator_id to articles table
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES profiles(id);

-- Step 4: Add creator_id to videos table
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES profiles(id);

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_creator_applications_status 
ON content_creator_applications(status);

CREATE INDEX IF NOT EXISTS idx_creator_applications_applicant 
ON content_creator_applications(applicant_id);

CREATE INDEX IF NOT EXISTS idx_articles_creator 
ON articles(creator_id);

CREATE INDEX IF NOT EXISTS idx_videos_creator 
ON videos(creator_id);

-- Step 6: Enable RLS on content_creator_applications
ALTER TABLE content_creator_applications ENABLE ROW LEVEL SECURITY;

-- Step 7: RLS Policies for content_creator_applications

-- Users can view their own applications
CREATE POLICY "Users can view own creator applications"
ON content_creator_applications FOR SELECT
USING (auth.uid() = applicant_id);

-- Users can create applications (one per user)
CREATE POLICY "Users can create creator applications"
ON content_creator_applications FOR INSERT
WITH CHECK (
    auth.uid() = applicant_id AND
    NOT EXISTS (
        SELECT 1 FROM content_creator_applications
        WHERE applicant_id = auth.uid()
    )
);

-- Admins can view all applications
CREATE POLICY "Admins can view all creator applications"
ON content_creator_applications FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Admins can update applications
CREATE POLICY "Admins can update creator applications"
ON content_creator_applications FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Step 8: Update RLS policies for articles to allow creators

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can manage articles" ON articles;

-- Admins and approved creators can insert articles
CREATE POLICY "Admins and creators can insert articles"
ON articles FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() 
        AND (role = 'admin' OR creator_status = 'approved')
    )
);

-- Admins and creators can update their own articles
CREATE POLICY "Admins and creators can update own articles"
ON articles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() 
        AND (role = 'admin' OR (creator_status = 'approved' AND articles.creator_id = auth.uid()))
    )
);

-- Admins and creators can delete their own articles
CREATE POLICY "Admins and creators can delete own articles"
ON articles FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() 
        AND (role = 'admin' OR (creator_status = 'approved' AND articles.creator_id = auth.uid()))
    )
);

-- Step 9: Update RLS policies for videos to allow creators

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can manage videos" ON videos;

-- Admins and approved creators can insert videos
CREATE POLICY "Admins and creators can insert videos"
ON videos FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() 
        AND (role = 'admin' OR creator_status = 'approved')
    )
);

-- Admins and creators can update their own videos
CREATE POLICY "Admins and creators can update own videos"
ON videos FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() 
        AND (role = 'admin' OR (creator_status = 'approved' AND videos.creator_id = auth.uid()))
    )
);

-- Admins and creators can delete their own videos
CREATE POLICY "Admins and creators can delete own videos"
ON videos FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() 
        AND (role = 'admin' OR (creator_status = 'approved' AND videos.creator_id = auth.uid()))
    )
);

-- Step 10: Create function to auto-update creator_status when application is approved
CREATE OR REPLACE FUNCTION update_creator_status_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        UPDATE profiles
        SET creator_status = 'approved'
        WHERE id = NEW.applicant_id;
    ELSIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
        UPDATE profiles
        SET creator_status = 'rejected'
        WHERE id = NEW.applicant_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_creator_status ON content_creator_applications;
CREATE TRIGGER trigger_update_creator_status
AFTER UPDATE ON content_creator_applications
FOR EACH ROW
EXECUTE FUNCTION update_creator_status_on_approval();

-- Step 11: Verification query
SELECT 
    COUNT(*) as total_applications,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
FROM content_creator_applications;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Content Creator System migration completed successfully';
    RAISE NOTICE 'Tables created: content_creator_applications';
    RAISE NOTICE 'Columns added: creator_status (profiles), creator_id (articles, videos)';
    RAISE NOTICE 'RLS policies updated for articles and videos';
END $$;
