import logging
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql.sqltypes import String, Integer, Boolean, DateTime, Date, Text, Numeric, JSON
from database import engine, Base
import models  # Import models to ensure they're registered in Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sync_db")

def get_sql_type(column):
    """
    Map SQLAlchemy column type to PostgreSQL SQL type string.
    """
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
        precision = getattr(column_type, 'precision', None)
        scale = getattr(column_type, 'scale', None)
        if precision and scale:
            return f"NUMERIC({precision}, {scale})"
        return "NUMERIC"
    elif isinstance(column_type, JSON):
        return "JSONB"
    elif isinstance(column_type, UUID):
        return "UUID"
    
    return str(column_type.compile(dialect=engine.dialect))

def sync_schema():
    logger.info("Starting database schema sync...")
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    # Iterate over all tables defined in models.py
    for table_name, table in Base.metadata.tables.items():
        if table_name not in existing_tables:
            logger.info(f"Table '{table_name}' does not exist. create_all() should handle this.")
            continue
            
        logger.info(f"Checking table: {table_name}")
        existing_columns = [c['name'] for c in inspector.get_columns(table_name)]
        
        with engine.connect() as conn:
            for column_name, column in table.columns.items():
                if column_name not in existing_columns:
                    sql_type = get_sql_type(column)
                    default_clause = ""
                    
                    # Handle basic defaults
                    if column.default is not None and hasattr(column.default, 'arg'):
                        if isinstance(column.default.arg, bool):
                            default_clause = f" DEFAULT {str(column.default.arg).upper()}"
                        elif isinstance(column.default.arg, (int, float)):
                            default_clause = f" DEFAULT {column.default.arg}"
                    
                    sql = f"ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS {column_name} {sql_type}{default_clause}"
                    logger.info(f"  Adding missing column: {column_name} ({sql_type})")
                    try:
                        conn.execute(text(sql))
                        conn.commit()
                    except Exception as e:
                        logger.error(f"  FAILED to add column {column_name}: {e}")
                        conn.rollback()
                        
    logger.info("Schema sync completed!")

if __name__ == "__main__":
    sync_schema()
