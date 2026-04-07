#!/bin/zsh

set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: ./scripts/cdk-with-env.zsh <stage> <cdk-args...>" >&2
  exit 1
fi

stage="$1"
shift

env_file=".env.${stage}"

if [[ -f "$env_file" ]]; then
  set -a
  source "$env_file"
  set +a
elif [[ "$stage" == "dev" || "$stage" == "staging" ]]; then
  echo "Info: $env_file not found. Continuing without stage secrets." >&2
fi

exec cdk --profile pcgabriel --context stage="$stage" "$@"
