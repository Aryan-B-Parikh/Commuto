import logging
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql.sqltypes import String, Integer, Boolean, DateTime, Date, Text, Numeric, JSON
from database import engine, Base
import models  # Ensure all models are loaded into Base.metadata

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sync_schema_v3")

def get_sql_type(column):
    """Map SQLAlchemy type to PostgreSQL SQL type string."""
    column_type = column.type
    if isinstance(column_type, String):
        return f"VARCHAR({column_type.length})" if column_type.length else "TEXT"
    elif isinstance(column_type, Integer):
        return "INTEGER"
    elif isinstance(column_type, Boolean):
        return "BOOLEAN"
    elif isinstance(column_type, DateTime):
        return "TIMESTAMP"
    elif isinstance(column_type, Date):
        return "DATE"
    elif isinstance(column_type, Text):
        return "TEXT"
    elif isinstance(column_type, Numeric):
        p, s = getattr(column_type, 'precision', None), getattr(column_type, 'scale', None)
        return f"NUMERIC({p}, {s})" if p and s else "NUMERIC"
    elif isinstance(column_type, JSON):
        return "JSONB"
    elif isinstance(column_type, UUID):
        return "UUID"
    return str(column_type.compile(dialect=engine.dialect))

def sync_all():
    logger.info("Starting Level 3: Advanced Schema & Constraint Sync...")
    inspector = inspect(engine)
    db_tables = inspector.get_table_names()

    with engine.connect() as conn:
        for table_name, model_table in Base.metadata.tables.items():
            if table_name not in db_tables:
                logger.info(f"Table '{table_name}' missing. Skipping creation (create_all handles new tables).")
                continue

            logger.info(f"Checking {table_name}:")
            db_columns = {c['name']: c for c in inspector.get_columns(table_name)}
            
            for col_name, model_col in model_table.columns.items():
                if col_name not in db_columns:
                    # Case 1: Column missing in DB
                    sql_type = get_sql_type(model_col)
                    null_clause = " NULL" if model_col.nullable else " NOT NULL"
                    sql = f"ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS {col_name} {sql_type}{null_clause}"
                    logger.info(f"  + Missing column: {col_name} ({sql_type})")
                    conn.execute(text(sql))
                    conn.commit()
                else:
                    # Case 2: Column exists, check nullability
                    db_nullable = db_columns[col_name]['nullable']
                    model_nullable = model_col.nullable 
                    
                    if db_nullable != model_nullable:
                        action = "DROP NOT NULL" if model_nullable else "SET NOT NULL"
                        sql = f"ALTER TABLE {table_name} ALTER COLUMN {col_name} {action}"
                        logger.info(f"  * Constraint mismatch: {col_name} {action}")
                        try:
                            conn.execute(text(sql))
                            conn.commit()
                            print(f"  OK: Synced constraint for {table_name}.{col_name}")
                        except Exception as e:
                            logger.error(f"  FAILED constraint sync for {col_name}: {e}")
                            conn.rollback()

    logger.info("Schema & Constraint sync completed!")

if __name__ == "__main__":
    sync_all()
