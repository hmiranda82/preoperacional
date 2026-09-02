#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy
echo "Migrations complete."

# Seed controlado: SOLO se ejecuta si RUN_SEED=true.
# Por defecto NO se siembra en producción para no pisar credenciales reales.
if [ "${RUN_SEED}" = "true" ]; then
  echo "Seeding database..."
  node dist/seed.js || echo "Seed already applied or skipped."
  echo "Seed complete."
else
  echo "Seed skipped (RUN_SEED != true)."
fi

echo "Starting server..."
exec node dist/main
