# Fix Foreign Key Constraint Error

## The Problem

You're seeing this error:
```
insert or update on table "user_shelves" violates foreign key constraint "user_shelves_user_id_fkey"
Key is not present in table "users".
```

This happens because:
1. Shelves are being saved with a `user_id` that doesn't exist in the `users` table
2. The foreign key constraint requires the user to exist first

## Solution: Make user_id Nullable

Run this SQL in Supabase SQL Editor to fix the constraint:

```sql
-- Make user_id nullable (allows shelves without user record)
ALTER TABLE user_shelves ALTER COLUMN user_id DROP NOT NULL;

-- Verify the change
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_shelves' 
AND column_name = 'user_id';
```

This allows shelves to be saved even if the user doesn't exist in the `users` table yet. The `spotify_id` is the primary key, so shelves are still uniquely identified.

## Alternative: Ensure Users Are Created First

If you prefer to keep the foreign key strict, make sure users are created in Supabase when they sign in. Check the OAuth callback logs to see if `createUser` is working.

---

**After running the SQL above, try adding an album again. It should work!**

