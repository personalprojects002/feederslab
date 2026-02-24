-- Migration: Change board.user_id from INTEGER to TEXT to match Better Auth string IDs
-- Run this SQL against your database

-- Step 1: Drop the foreign key constraint (if it exists)
ALTER TABLE board DROP CONSTRAINT IF EXISTS board_user_id_fkey;

-- Step 2: Change the column type from INTEGER to TEXT
ALTER TABLE board ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Step 3: Re-add the foreign key constraint
ALTER TABLE board ADD CONSTRAINT board_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'board' AND column_name = 'user_id';
