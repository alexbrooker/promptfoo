#!/usr/bin/env python3
"""
Use pg_dump via subprocess to extract Supabase schema
"""

import os
import subprocess
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def extract_with_pg_dump():
    db_password = os.getenv('SUPABASE_DATABASE_PASSWORD')
    
    if not db_password:
        raise ValueError("SUPABASE_DATABASE_PASSWORD must be set in .env")
    
    # Set PGPASSWORD environment variable for pg_dump
    env = os.environ.copy()
    env['PGPASSWORD'] = db_password
    
    # pg_dump command to extract schema only
    cmd = [
        'pg_dump',
        '--host=db.dyowbujltaepepjzlnjb.supabase.co',
        '--port=5432',
        '--username=postgres',
        '--dbname=postgres',
        '--schema-only',  # Only schema, no data
        '--no-owner',     # Don't include ownership commands
        '--no-privileges', # Don't include privilege commands
        '--schema=public' # Only public schema
    ]
    
    print(f"Running pg_dump...")
    
    try:
        # Run pg_dump and capture output
        result = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            # Write schema to file
            with open('supabase_schema.sql', 'w') as f:
                f.write(result.stdout)
            print(f"Schema successfully exported to supabase_schema.sql")
        else:
            print(f"pg_dump failed with return code {result.returncode}")
            print(f"Error: {result.stderr}")
            
    except subprocess.TimeoutExpired:
        print("pg_dump timed out")
    except FileNotFoundError:
        print("pg_dump not found. Please install postgresql-client")
    except Exception as e:
        print(f"Error running pg_dump: {e}")

if __name__ == "__main__":
    extract_with_pg_dump()