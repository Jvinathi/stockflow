# StockFlow — Multi-Tenant Inventory & Order Management SaaS

A production-style SaaS platform where multiple businesses independently manage inventory, staff roles, orders, and invoices under one shared application — built to demonstrate real-world backend architecture patterns: multi-tenancy, RBAC, background jobs, and transactional data integrity.

**Live demo:** [https://stockflow-swart.vercel.app/](#)
**API docs:** [https://stockflow-backend-628n.onrender.com/](#)

> Note: the backend is hosted on Render's free tier, which sleeps after 15 minutes of inactivity. The first request may take 30-50 seconds to wake it up.

## Features

- **Multi-tenant architecture** — row-level data isolation via `tenant_id` scoping enforced on every table and every query
- **Role-based access control** — OWNER / MANAGER / STAFF roles, enforced through a reusable, parameterized FastAPI dependency and reflected in the UI
- **Inventory management** — full CRUD for products with stock tracking and configurable reorder thresholds
- **Order processing** — multi-item orders with atomic stock validation/decrement transactions (all-or-nothing, with rollback on failure)
- **Invoice generation** — auto-generated, styled PDF invoices via WeasyPrint + Jinja2
- **Automated low-stock alerts** — APScheduler background job with duplicate-alert prevention
- **Analytics dashboard** — revenue trends, top-selling products, and live business stats with interactive Recharts visualizations

## Tech Stack

**Backend:** FastAPI · SQLAlchemy · MySQL · JWT (python-jose) · Passlib (bcrypt) · APScheduler · WeasyPrint · Pydantic

**Frontend:** React (Vite) · Tailwind CSS · Recharts · Axios · React Router

**Infra:** Render (backend) · Clever Cloud (MySQL) · Vercel (frontend)

## Architecture

Multi-tenancy is implemented via **shared database, shared schema, row-level isolation** — every tenant-owned table carries a `tenant_id` foreign key, and every single query is scoped by the authenticated user's `tenant_id` (extracted from their JWT) through a reusable FastAPI dependency (`get_current_user`). This is the same approach used by early-stage SaaS products like Slack and Notion — chosen over a separate-database-per-tenant model for simplicity, while remaining a production-realistic, upgradeable pattern.

RBAC is enforced through a parameterized dependency, `require_roles(*allowed_roles)`, applied per-route — so permission logic lives in one composable place rather than scattered checks across every handler.

\```
React SPA (Vercel) ──HTTPS──> FastAPI (Render)
                                 ├── Auth/RBAC middleware (JWT)
                                 ├── Products / Orders / Invoices routers
                                 ├── Analytics aggregation service
                                 └── APScheduler background job
                                          │
                                          ▼
                                MySQL (Clever Cloud, tenant_id scoped)
\```

## Getting Started Locally

### Backend
\```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
# create a .env file (see below)
uvicorn app.main:app --reload
\```

### Frontend
\```bash
cd frontend
npm install
# create a .env file (see below)
npm run dev
\```

## Environment Variables

**backend/.env**
\```
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/stockflow_db
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ALLOWED_ORIGINS=http://localhost:5173
\```

**frontend/.env**
\```
VITE_API_BASE_URL=http://127.0.0.1:8000
\```

## API Overview

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Creates a new tenant + OWNER account |
| POST | `/api/auth/login` | Public | Returns a JWT |
| GET/POST/PUT/DELETE | `/api/products` | Role-based | Inventory CRUD |
| GET/POST | `/api/orders` | Any logged-in role | Order history & creation |
| GET | `/api/invoices/{order_id}` | Any logged-in role | Download PDF invoice |
| GET | `/api/notifications` | OWNER/MANAGER | Low-stock alerts |
| GET | `/api/analytics/summary` | OWNER/MANAGER | Revenue, top products, trends |

Full interactive API documentation is available at `/docs` (Swagger UI) on the deployed backend.

## Known Limitations

- Stock decrement uses application-level validation rather than database row-locking (`SELECT ... FOR UPDATE`) — sufficient for demo/portfolio traffic, but a high-concurrency production system would need this hardening to fully eliminate race conditions on simultaneous orders for the same product.
- Uses SQLAlchemy's `create_all()` for schema management rather than versioned Alembic migrations — appropriate for this project's scope; a larger system would use Alembic for tracked, reversible schema changes.
- Email uniqueness is enforced globally rather than per-tenant, so one email can only ever belong to a single business account.

## License

MIT

**backend/.env**
