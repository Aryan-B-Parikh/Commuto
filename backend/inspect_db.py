from sqlalchemy import create_engine, text, inspect
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

print("Inspecting database schema...\n")

inspector = inspect(engine)

# List all tables
tables = inspector.get_table_names()
print(f"Tables in database: {tables}\n")

# For each table, show columns and their types
for table in tables:
    print(f"\n=== Table: {table} ===")
    columns = inspector.get_columns(table)
    for col in columns:
        print(f"  {col['name']}: {col['type']} (nullable={col['nullable']})")
    
    # Show foreign keys
    fks = inspector.get_foreign_keys(table)
    if fks:
        print(f"\n  Foreign Keys:")
        for fk in fks:
            print(f"    {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}")
