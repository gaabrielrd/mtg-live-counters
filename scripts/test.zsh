#!/bin/zsh

set -euo pipefail

cleanup() {
  docker compose -f docker-compose.test.yml down -v >/dev/null 2>&1 || true
}

trap cleanup EXIT

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not running. Start Docker to execute the DynamoDB Local integration tests." >&2
  exit 1
fi

docker compose -f docker-compose.test.yml up -d dynamodb-local >/dev/null
sleep 2

MATCH_REPOSITORY_TEST_ENDPOINT="http://127.0.0.1:8000" \
  tsx --test packages/shared/src/**/*.test.ts apps/api/src/**/*.test.ts
