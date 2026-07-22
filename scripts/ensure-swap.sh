#!/usr/bin/env bash
# Ensure a 2GB swap file exists (prevents OOM kills on ~4GB instances).
set -euo pipefail

SWAPFILE="${SWAPFILE:-/swapfile}"
SWAP_GB="${SWAP_GB:-2}"

if swapon --show | grep -q "${SWAPFILE}"; then
  echo "Swap already active: ${SWAPFILE}"
  swapon --show
  exit 0
fi

if [[ -f "${SWAPFILE}" ]]; then
  echo "Enabling existing swap file ${SWAPFILE}"
  sudo chmod 600 "${SWAPFILE}"
  sudo mkswap "${SWAPFILE}" >/dev/null 2>&1 || true
  sudo swapon "${SWAPFILE}"
else
  echo "Creating ${SWAP_GB}G swap at ${SWAPFILE}"
  sudo fallocate -l "${SWAP_GB}G" "${SWAPFILE}" || sudo dd if=/dev/zero of="${SWAPFILE}" bs=1M count=$((SWAP_GB * 1024)) status=progress
  sudo chmod 600 "${SWAPFILE}"
  sudo mkswap "${SWAPFILE}"
  sudo swapon "${SWAPFILE}"
fi

# Persist across reboots
if ! grep -q "${SWAPFILE}" /etc/fstab 2>/dev/null; then
  echo "${SWAPFILE} none swap sw 0 0" | sudo tee -a /etc/fstab >/dev/null
fi

echo "Swap enabled:"
swapon --show
free -h
