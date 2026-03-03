import models
from database import engine, Base
from sqlalchemy import text, inspect, Column
import sqlalchemy

def get_sql_type(column: Column):
    """Convert SQLAlchemy column type to SQL type string for PostgreSQL."""
    type_ = column.type
    if isinstance(type_, sqlalchemy.String):
        return f"VARCHAR({type_.length})" if type_.length else "VARCHAR"
    elif isinstance(type_, sqlalchemy.Integer):
        return "INTEGER"
    elif isinstance(type_, sqlalchemy.Boolean):
        return "BOOLEAN"
    elif isinstance(type_, sqlalchemy.DateTime):
        return "TIMESTAMP"
    elif isinstance(type_, sqlalchemy.Date):
        return "DATE"
    elif isinstance(type_, sqlalchemy.Numeric):
        return f"NUMERIC"
    elif isinstance(type_, sqlalchemy.Text):
        return "TEXT"
    elif isinstance(type_, sqlalchemy.JSON):
        return "JSON"
    elif isinstance(type_, sqlalchemy.dialects.postgresql.UUID):
        return "UUID"
    return str(type_)

def fix_schema():
    inspector = inspect(engine)
    
    with engine.connect() as conn:
        for name, table in Base.metadata.tables.items():
            print(f"Checking table: {name}")
            try:
                db_columns = {c['name']: c for c in inspector.get_columns(name)}
            except Exception:
                print(f"  Table {name} does not exist in DB yet.")
                continue
            
            for column_name, column in table.columns.items():
                if column_name not in db_columns:
                    print(f"  Missing column: {column_name}")
                    sql_type = get_sql_type(column)
                    
                    default_clause = ""
                    if column.default is not None and not callable(column.default.arg):
                        default_val = column.default.arg
                        if isinstance(default_val, str):
                            default_clause = f" DEFAULT '{default_val}'"
                        elif isinstance(default_val, (int, float, bool)):
                            default_clause = f" DEFAULT {str(default_val).upper()}"
                    
                    alter_query = f"ALTER TABLE {name} ADD COLUMN {column_name} {sql_type}{default_clause}"
                    print(f"  Executing: {alter_query}")
                    try:
                        conn.execute(text(alter_query))
                        conn.commit()
                        print(f"  Successfully added '{column_name}' to '{name}'.")
                    except Exception as e:
                        print(f"  Error adding column: {e}")
                        conn.rollback()

if __name__ == "__main__":
    fix_schema()
