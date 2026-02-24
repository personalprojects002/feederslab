"""
Migration script to change board.user_id from INTEGER to TEXT
Run this once to fix the database schema
"""
from sqlalchemy import text
from src.config.db import engine

def migrate():
    try:
        with engine.begin() as conn:
            print("🔄 Starting migration...")
            
            # Step 1: Drop foreign key constraint
            print("1️⃣ Dropping foreign key constraint...")
            conn.execute(text("ALTER TABLE board DROP CONSTRAINT IF EXISTS board_user_id_fkey;"))
            
            # Step 2: Change column type
            print("2️⃣ Changing user_id from INTEGER to TEXT...")
            conn.execute(text("ALTER TABLE board ALTER COLUMN user_id TYPE TEXT;"))
            
            # Step 3: Re-add foreign key
            print("3️⃣ Re-adding foreign key constraint...")
            conn.execute(text("""
                ALTER TABLE board ADD CONSTRAINT board_user_id_fkey 
                FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
            """))
            
            print("✅ Migration completed successfully!")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise

if __name__ == "__main__":
    migrate()
