import models
from database import engine, Base
from sqlalchemy import inspect

def check_schema():
    inspector = inspect(engine)
    print(f"Tables in metadata: {list(Base.metadata.tables.keys())}")
    with open('schema_dump.txt', 'w') as f:
        for name, table in Base.metadata.tables.items():
            print(f"Checking table: {name}")
            try:
                db_columns = {c['name']: c for c in inspector.get_columns(name)}
                model_cols = [c.name for c in table.columns]
                missing = set(model_cols) - set(db_columns.keys())
                f.write(f"{name}:\n")
                f.write(f"  Missing: {list(missing)}\n")
                print(f"  {name}: Missing {list(missing)}")
            except Exception as e:
                print(f"  Error checking {name}: {e}")

if __name__ == "__main__":
    check_schema()
