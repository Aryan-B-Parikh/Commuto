import sys
from database import engine
from sqlalchemy import inspect

try:
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables found: {tables}")
    sys.stdout.flush()

    for table in tables:
        print(f"\nTable: {table}")
        columns = inspector.get_columns(table)
        for column in columns:
            print(f"  - {column['name']} ({column['type']})")
        sys.stdout.flush()
except Exception as e:
    print(f"Error: {e}")
    sys.stdout.flush()
