"""
Migration script: Add new columns to existing tables for Tiers 1-3.
Run once to bring the NeonDB schema up to date with models.py.
"""
from database import engine
from sqlalchemy import text

MIGRATIONS = [
    # --- User table: profile fields ---
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact JSONB",
    
    # --- Driver table: new fields ---
    "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS insurance_status VARCHAR(20) DEFAULT 'pending'",
    "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS max_passengers INTEGER DEFAULT 4",
    "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS route_radius INTEGER DEFAULT 10",
    
    # --- Passenger table: accessibility ---
    "ALTER TABLE passengers ADD COLUMN IF NOT EXISTS accessibility_needs BOOLEAN DEFAULT FALSE",
    
    # --- New tables (create_all handles these, but let's be explicit) ---
    """CREATE TABLE IF NOT EXISTS payment_methods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        type VARCHAR(20) NOT NULL,
        provider VARCHAR(50) NOT NULL,
        last4 VARCHAR(4),
        is_default BOOLEAN DEFAULT FALSE,
        razorpay_token TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    )""",
    
    """CREATE TABLE IF NOT EXISTS wallets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id),
        balance NUMERIC(10, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    )""",
    
    """CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_id UUID NOT NULL REFERENCES wallets(id),
        amount NUMERIC(10, 2) NOT NULL,
        type VARCHAR(20) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        razorpay_order_id VARCHAR(100),
        razorpay_payment_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
    )""",
    
    # Indexes
    "CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id)",
]

def run_migrations():
    print("Running migrations...")
    with engine.connect() as conn:
        for i, sql in enumerate(MIGRATIONS):
            try:
                conn.execute(text(sql))
                conn.commit()
                label = sql.strip().split('\n')[0][:60]
                print(f"  [{i+1}/{len(MIGRATIONS)}] OK: {label}")
            except Exception as e:
                print(f"  [{i+1}/{len(MIGRATIONS)}] SKIP/ERR: {str(e)[:80]}")
                conn.rollback()
    print("Migrations complete!")

if __name__ == "__main__":
    run_migrations()
