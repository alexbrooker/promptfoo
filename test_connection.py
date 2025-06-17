#!/usr/bin/env python3
"""
Test Supabase connection
"""

import os
import psycopg2
from urllib.parse import urlparse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_connection():
    # Get database password
    db_password = os.getenv('SUPABASE_DATABASE_PASSWORD')
    
    print(f"Password found: {'Yes' if db_password else 'No'}")
    
    if not db_password:
        raise ValueError("SUPABASE_DATABASE_PASSWORD must be set in .env")
    
    # Supabase Session pooler connection parameters
    conn_params = {
        'host': 'db.dyowbujltaepepjzlnjb.supabase.co',
        'port': 6543,
        'database': 'postgres',
        'user': 'postgres.dyowbujltaepepjzlnjb',
        'password': db_password
    }
    
    print(f"Connecting to db.dyowbujltaepepjzlnjb.supabase.co:6543 (Session Pooler)...")
    
    try:
        # Connect to database
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()
        
        # Simple test query
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"Connected successfully! PostgreSQL version: {version[0]}")
        
        # Test table list
        cursor.execute("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
        table_count = cursor.fetchone()[0]
        print(f"Found {table_count} tables in public schema")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"Connection failed: {e}")
        return False

if __name__ == "__main__":
    test_connection()