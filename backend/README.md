# Backend

## Setup

1. Copy `.env.example` to `.env` and fill in your MSSQL and JWT config.
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```
4. The API will run on `http://localhost:5000` by default.

## Endpoints

- `POST /auth/register` — Register new user (employee or manager)
- `POST /auth/login` — Login, returns JWT
- `POST /reports` — Upload a report (file + notes, employee only)
- `GET /reports/my` — List your reports (employee)
- `GET /reports` — List all reports (manager only, filter by ?date= & ?employeeId=)
- `GET /reports/:id` — Get report detail (owner or manager) 