#!/usr/bin/env bash
set -euo pipefail

# check if .env exists
if [ ! -f .env ]; then
    echo "No .env file found. Please create one and try again. (check env.sample)"
    exit 1
fi

source .env

# check if psql is installed, otherwise install
if ! command -v psql &> /dev/null; then
    echo "psql could not be found. Please wait while I try to install it for you."
    sudo apt-get install -y postgresql-client
fi

# check if hasura is installed, otherwise install
if ! command -v hasura &> /dev/null; then
    echo "hasura could not be found. Please wait while I try to install it for you."
    sudo apt-get install -y hasura
fi

docker compose down hasura
docker compose down postgres

sudo rm -rf postgres_data

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

sleep 10

cd bdjuno/hasura

hasura metadata apply --endpoint http://localhost:$HASURA_PORT --admin-secret password


