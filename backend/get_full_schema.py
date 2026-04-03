from database import engine
from sqlalchemy import inspect
import json

def get_full_schema():
    inspector = inspect(engine)
    schema = {}
    for table_name in inspector.get_table_names():
        columns = inspector.get_columns(table_name)
        schema[table_name] = [c['name'] for c in columns]
    print(json.dumps(schema, indent=2))

if __name__ == "__main__":
    get_full_schema()
