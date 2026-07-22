#!/usr/bin/env bash
# Remove unused digital-prescription iframe bundle (replaced by native Write Prescription UI).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

rm -rf "${ROOT}/Frontend/public/digital-prescription"
if [[ -d "${HOME}/.mediease/Frontend/dist/digital-prescription" ]]; then
  sudo rm -rf "${HOME}/.mediease/Frontend/dist/digital-prescription"
fi

echo "Removed digital-prescription static bundles from source and deployed dist."
