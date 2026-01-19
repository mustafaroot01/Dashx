# Project Run Instructions

## Prerequisites
- PHP & Composer (for Backend)
- Node.js & npm (for Frontend)

## Backend (Laravel)
The backend API runs on port 8000.

```bash
cd backend
composer install
php artisan key:generate
php artisan migrate  # Optional: if you need to set up the database
php artisan serve
```

## Frontend (Next.js)
The frontend application runs on port 3000.

```bash
cd frontend
npm install
npm run dev
```

## Running Both
You will need two terminal tabs/windows, one for each service.
