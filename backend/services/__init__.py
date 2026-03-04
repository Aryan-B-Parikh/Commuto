"""
Service layer for Commuto backend.

Business logic lives here; routers are thin HTTP adapters that delegate to these
services. This separation keeps the transport layer (FastAPI routing) decoupled
from the domain layer (business rules, database access patterns, external calls).

Incremental migration plan:
  1. wallet_service  – ride payment processing & ledger management
  2. rating_service  – driver weighted-average rating calculation
  3. email_service   – email template building & SMTP dispatch
"""
