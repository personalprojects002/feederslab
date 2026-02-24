"""
Migration Script - Add Stripe Fields to User Table

This script adds the following columns to the 'user' table:
- customer_id (VARCHAR, nullable, indexed)
- has_access (BOOLEAN, default False)
- stripe_current_period_end (TIMESTAMP, nullable)

How to run:
    python run_stripe_migration.py

What it does:
    1. Connects to PostgreSQL database using DATABASE_URL from .env
    2. Checks if columns already exist (to prevent errors)
    3. Adds each column if it doesn't exist
    4. Prints success/failure messages for each column
    5. Verifies that columns were created
"""

import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

# Load environment variables from .env file
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ ERROR: DATABASE_URL not found in .env file")
    exit(1)

def migration():
    """Run the migration to add Stripe fields to User table"""
    try:
        # Connect to database
        print("🔌 Connecting to database...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        print("✅ Connected to database\n")

        # Check if columns already exist
        print("🔍 Checking for existing columns...\n")

        cursor.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='user'
        """)
        existing_columns = {row['column_name'] for row in cursor.fetchall()}
        print(f"Existing columns: {existing_columns}\n")

        # Column definitions
        columns_to_add = [
            {
                "name": "customer_id",
                "definition": "customer_id VARCHAR(255)",
                "description": "Stripe Customer ID"
            },
            {
                "name": "has_access",
                "definition": "has_access BOOLEAN DEFAULT FALSE",
                "description": "User has active subscription"
            },
            {
                "name": "stripe_current_period_end",
                "definition": "stripe_current_period_end TIMESTAMP",
                "description": "When subscription ends"
            }
        ]

        # Add missing columns
        for col in columns_to_add:
            if col["name"] in existing_columns:
                print(f"⏭️  '{col['name']}' already exists - SKIPPING")
            else:
                print(f"➕ Adding '{col['name']}' ({col['description']})...")
                try:
                    cursor.execute(f"ALTER TABLE \"user\" ADD COLUMN {col['definition']}")
                    conn.commit()
                    print(f"✅ '{col['name']}' added successfully\n")
                except Exception as e:
                    conn.rollback()
                    print(f"❌ Failed to add '{col['name']}': {str(e)}\n")

        # Add index to customer_id if it doesn't exist
        print("🔍 Checking for customer_id index...")
        cursor.execute("""
            SELECT indexname FROM pg_indexes 
            WHERE tablename='user' AND indexname='ix_user_customer_id'
        """)
        if cursor.fetchone():
            print("⏭️  Index already exists - SKIPPING\n")
        else:
            print("➕ Creating index on customer_id...")
            try:
                cursor.execute("CREATE INDEX ix_user_customer_id ON \"user\"(customer_id)")
                conn.commit()
                print("✅ Index created successfully\n")
            except Exception as e:
                conn.rollback()
                print(f"❌ Failed to create index: {str(e)}\n")

        # Verify columns were created
        print("🔍 Verifying columns...\n")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name='user' AND column_name IN ('customer_id', 'has_access', 'stripe_current_period_end')
            ORDER BY column_name
        """)
        
        results = cursor.fetchall()
        if results:
            print("✅ New columns found:")
            for row in results:
                nullable = "nullable" if row['is_nullable'] == 'YES' else "not nullable"
                print(f"   - {row['column_name']}: {row['data_type']} ({nullable})")
        else:
            print("⚠️  No columns found - migration may have failed")

        print("\n" + "="*60)
        print("✅ Migration completed successfully!")
        print("="*60)

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        exit(1)

if __name__ == "__main__":
    migration()
