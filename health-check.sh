#!/bin/bash

# MediEase Clinic health check script
# Verifies the FastAPI backend (via Nginx) and the frontend landing page.

set -euo pipefail

BACKEND_URL="https://app.clinic.alteredai.care/api/health"
FRONTEND_URL="https://app.clinic.alteredai.care"
TIMEOUT_SECONDS=10

print_status() {
    local status="$1"
    local message="$2"
    case "$status" in
        OK)
            echo -e "\033[0;32m[OK]\033[0m $message"
            ;;
        FAIL)
            echo -e "\033[0;31m[FAIL]\033[0m $message"
            ;;
        INFO)
            echo -e "\033[0;34m[INFO]\033[0m $message"
            ;;
        *)
            echo -e "[$status] $message"
            ;;
    esac
}

check_backend() {
    print_status INFO "Checking backend at $BACKEND_URL"
    local response http_code
    response=$(curl -s -m "$TIMEOUT_SECONDS" -w "%{http_code}" "$BACKEND_URL")
    http_code="${response: -3}"
    body="${response:: -3}"

    if [[ "$http_code" == "200" ]]; then
        if echo "$body" | jq -e '.status == "healthy"' >/dev/null 2>&1; then
            print_status OK "Backend healthy (HTTP $http_code)"
        else
            print_status FAIL "Backend responded with HTTP $http_code but unexpected payload"
            echo "$body"
            return 1
        fi
    else
        print_status FAIL "Backend health check failed (HTTP $http_code)"
        echo "$body"
        return 1
    fi
}

check_frontend() {
    print_status INFO "Checking frontend at $FRONTEND_URL"
    local http_code
    http_code=$(curl -s -m "$TIMEOUT_SECONDS" -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
    if [[ "$http_code" == "200" ]]; then
        print_status OK "Frontend reachable (HTTP $http_code)"
    else
        print_status FAIL "Frontend check failed (HTTP $http_code)"
        return 1
    fi
}

main() {
    local exit_code=0

    if ! check_backend; then
        exit_code=1
    fi

    if ! check_frontend; then
        exit_code=1
    fi

    if [[ "$exit_code" -eq 0 ]]; then
        print_status OK "All services are up"
    else
        print_status FAIL "One or more services are down"
    fi

    exit "$exit_code"
}

main "$@"

