-- Script to normalize all existing player names in the database
-- This will trim whitespace from all names

-- First, let's see what needs to be fixed (names with leading/trailing spaces)
SELECT DISTINCT 
  name as original_name,
  TRIM(name) as trimmed,
  LENGTH(name) as original_length,
  LENGTH(TRIM(name)) as trimmed_length,
  COUNT(*) as count
FROM players
WHERE name != TRIM(name)
GROUP BY name
ORDER BY name;

-- To apply the fix, run this:
UPDATE players
SET name = TRIM(name);

-- After running, verify the cleanup worked:
SELECT name, COUNT(*) as count
FROM players
GROUP BY name
ORDER BY name;

