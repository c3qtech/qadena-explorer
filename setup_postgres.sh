#!/usr/bin/env bash
set -euo pipefail

docker compose down hasura
docker compose down postgres

rm -rf postgres_data/*

docker compose up postgres -d

sleep 5

# Connection parameters
HOST="localhost"
PORT="5432"
USER="root"
DB="callisto"
# You can set PGPASSWORD in the environment before running this script
export PGPASSWORD="password"

SCHEMA_DIR="bdjuno/database/schema"

# Find and sort all .sql files in the schema directory
FILES=$(ls "$SCHEMA_DIR"/*.sql | sort)

for file in $FILES; do
  echo "👉 Running $file..."
  psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" -f "$file"
done

echo "✅ All schema scripts executed successfully."

docker compose up hasura -d

sleep 5

cd bdjuno/hasura

hasura metadata apply --endpoint http://localhost:8080 --admin-secret password

docker logs hasura -f

