#!/usr/bin/env bash
# Gather Docker Postgres diagnostics and propose DATABASE_URL/DIRECT_URL

set -u
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; NC='\033[0m'

echo "# Blue Cinis - Docker Postgres diagnostics"
echo "# Host: $(uname -a)"

# 1) Docker available?
if ! command -v docker >/dev/null 2>&1; then
  echo -e "${RED}Docker is not installed or not in PATH.${NC}"
  exit 1
fi

echo "# Docker version: $(docker --version 2>/dev/null || echo 'unknown')"

PSFMT='{{.ID}}|{{.Image}}|{{.Names}}|{{.Ports}}'
POSTGRES_LINES=$(docker ps --format "$PSFMT" | grep -Eiq 'postgres' && docker ps --format "$PSFMT" | grep -Ei 'postgres' || true)

if [ -z "$POSTGRES_LINES" ]; then
  echo -e "${YELLOW}No running Postgres container found. Start one, for example:${NC}"
  echo "  docker run --name lg-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=loire -p 5432:5432 -d postgres:15"
  exit 2
fi

echo "# Running Postgres containers:"
echo "$POSTGRES_LINES" | sed 's/^/  - /'

# Only use the first match
LINE=$(echo "$POSTGRES_LINES" | head -n 1)
CID=$(echo "$LINE" | cut -d '|' -f1)
CIMG=$(echo "$LINE" | cut -d '|' -f2)
CNM=$(echo "$LINE" | cut -d '|' -f3)
CPORTS=$(echo "$LINE" | cut -d '|' -f4)

echo "# Selected container: $CID ($CNM, image: $CIMG)"
echo "# Ports: $CPORTS"

# 2) Read container env
ENV_OUT=$(docker exec "$CID" env 2>/dev/null || true)
PGUSER=$(echo "$ENV_OUT" | grep -E '^POSTGRES_USER=' | head -n1 | cut -d '=' -f2)
PGPASS=$(echo "$ENV_OUT" | grep -E '^POSTGRES_PASSWORD=' | head -n1 | cut -d '=' -f2)
PGDB=$(echo "$ENV_OUT" | grep -E '^POSTGRES_DB=' | head -n1 | cut -d '=' -f2)

[ -z "${PGUSER:-}" ] && PGUSER=postgres
[ -z "${PGDB:-}" ] && PGDB=postgres

MASKED_PASS="$([ -n "${PGPASS:-}" ] && echo '*****' || echo '')"
echo "# Container env: POSTGRES_USER=${PGUSER} POSTGRES_DB=${PGDB} POSTGRES_PASSWORD=${MASKED_PASS}"

# 3) Determine host port mapping for 5432
PORTS_JSON=$(docker inspect -f '{{json .NetworkSettings.Ports}}' "$CID" 2>/dev/null || echo '{}')
HOSTPORT=$(echo "$PORTS_JSON" | node -e '
try{const data=JSON.parse(require("fs").readFileSync(0,"utf8"));
const m=data["5432/tcp"]; if(Array.isArray(m)&&m.length>0) process.stdout.write(m[0].HostPort||""); else process.stdout.write("");}catch(e){process.stdout.write("")}
')

if [ -n "$HOSTPORT" ]; then
  echo "# Detected host port mapping: localhost:$HOSTPORT -> container:5432"
else
  echo -e "${YELLOW}No host port mapping detected for 5432/tcp. Service may be internal-only.${NC}"
fi

# 4) Try psql inside container
echo "# Testing psql inside container..."
IN_PSQL_OK=0
docker exec "$CID" bash -lc "psql -U '$PGUSER' -d '$PGDB' -c 'SELECT 1;'" >/dev/null 2>&1 && IN_PSQL_OK=1 || IN_PSQL_OK=0

if [ "$IN_PSQL_OK" -eq 1 ]; then
  echo -e "${GREEN}OK inside container (psql)${NC}"
else
  echo -e "${RED}FAILED inside container (psql)${NC}"
fi

# 5) Try psql from host if available and hostport exposed
HOST_PSQL_OK=0
if command -v psql >/dev/null 2>&1 && [ -n "$HOSTPORT" ]; then
  echo "# Testing psql from host on localhost:$HOSTPORT (sslmode=disable)..."
  if [ -n "${PGPASS:-}" ]; then
    PSQL_URL="postgresql://$PGUSER:$PGPASS@localhost:$HOSTPORT/$PGDB?sslmode=disable"
  else
    PSQL_URL="postgresql://$PGUSER@localhost:$HOSTPORT/$PGDB?sslmode=disable"
  fi
  psql "$PSQL_URL" -c 'SELECT 1;' >/dev/null 2>&1 && HOST_PSQL_OK=1 || HOST_PSQL_OK=0
  if [ "$HOST_PSQL_OK" -eq 1 ]; then
    echo -e "${GREEN}OK from host (psql)${NC}"
  else
    echo -e "${RED}FAILED from host (psql)${NC}"
  fi
else
  echo -e "${YELLOW}Skipping host psql test (psql not found or no host port mapping).${NC}"
fi

# 6) Propose .env values
echo "# Suggested .env values:"
if [ -n "$HOSTPORT" ]; then
  URL_USER="$PGUSER"; URL_PASS="${PGPASS:-password}"; URL_DB="$PGDB"; URL_PORT="$HOSTPORT"
  echo "DATABASE_URL=\"postgresql://$URL_USER:$URL_PASS@localhost:$URL_PORT/$URL_DB?schema=public\""
  echo "DIRECT_URL=\"postgresql://$URL_USER:$URL_PASS@localhost:$URL_PORT/$URL_DB?schema=public\""
else
  # Compose-internal host suggestion
  URL_USER="$PGUSER"; URL_PASS="${PGPASS:-password}"; URL_DB="$PGDB"; URL_HOST="$CNM"
  echo "DATABASE_URL=\"postgresql://$URL_USER:$URL_PASS@$URL_HOST:5432/$URL_DB?schema=public\""
  echo "DIRECT_URL=\"postgresql://$URL_USER:$URL_PASS@$URL_HOST:5432/$URL_DB?schema=public\""
fi

echo
echo "# Summary (JSON)"
node -e 'const fs=require("fs");
const sum={};
sum.hostPort=process.env.HOSTPORT||"";
console.log(JSON.stringify(sum));' >/dev/null 2>&1 || true

cat <<JSON
{
  "container": { "id": "$CID", "name": "$CNM", "image": "$CIMG" },
  "env": { "POSTGRES_USER": "$PGUSER", "POSTGRES_DB": "$PGDB", "POSTGRES_PASSWORD": "$MASKED_PASS" },
  "hostPort": "$HOSTPORT",
  "tests": { "psqlInContainer": $IN_PSQL_OK, "psqlFromHost": $HOST_PSQL_OK }
}
JSON

echo "# Next steps:"
echo "1) Copy the suggested DATABASE_URL and DIRECT_URL into your .env"
echo "2) Run: npm run db:generate && npm run db:dev && npm run seed"
echo "3) Then check: curl http://localhost:3000/api/health"
