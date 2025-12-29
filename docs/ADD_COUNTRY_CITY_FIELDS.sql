-- ADD COUNTRY AND CITY FIELDS TO PROFILES
-- This migration adds country and city fields to replace the region field

-- Step 1: Add new columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

-- Step 2: Migrate existing region data to country (for Chilean users)
-- Assuming most existing users are from Chile
UPDATE profiles
SET country = 'Chile'
WHERE country IS NULL AND region IS NOT NULL;

-- Step 3: Create index for better performance on country searches
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);

-- Step 4: Add comment to columns
COMMENT ON COLUMN profiles.country IS 'User country - prioritizes South American countries';
COMMENT ON COLUMN profiles.city IS 'User city within their country';

-- Step 5: Verification query
SELECT 
    COUNT(*) as total_profiles,
    COUNT(country) as with_country,
    COUNT(city) as with_city,
    COUNT(region) as with_region
FROM profiles;

-- Note: The 'region' column is kept for backwards compatibility
-- New registrations will use 'country' and 'city'
-- You can drop 'region' column later if needed with:
-- ALTER TABLE profiles DROP COLUMN region;
