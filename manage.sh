#!/usr/bin/env bash

set -euo pipefail

PORT="${PORT:-8080}"
HOST="${HOST:-127.0.0.1}"
LOCAL_STORAGE_PORT="${LOCAL_STORAGE_PORT:-8081}"
LOCAL_STORAGE_HOST="${LOCAL_STORAGE_HOST:-127.0.0.1}"
APP_NAME="Harumi Store"
LOG_FILE="${LOG_FILE:-/tmp/harumi-store-vite.log}"
STORAGE_LOG_FILE="${STORAGE_LOG_FILE:-/tmp/harumi-store-storage.log}"

command="${1:-start}"

is_local_storage_enabled() {
  if [[ -f ".env" ]]; then
    local value
    value="$(grep -E '^VITE_LOCAL_STORAGE=' .env | tail -n 1 | cut -d '=' -f 2- | tr '[:upper:]' '[:lower:]' || true)"
    [[ "${value}" == "true" || "${value}" == "1" || "${value}" == "yes" ]]
    return
  fi

  return 1
}

port_pids() {
  local port="${1:-${PORT}}"
  lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true
}

stop_port() {
  local port="${1:-${PORT}}"
  local pids
  pids="$(port_pids "${port}")"

  if [[ -z "${pids}" ]]; then
    echo "Port ${port} kosong."
    return 0
  fi

  echo "Menghentikan proses di port ${port}: ${pids}"
  kill ${pids} 2>/dev/null || true
  sleep 1

  pids="$(port_pids "${port}")"
  if [[ -n "${pids}" ]]; then
    echo "Proses masih hidup, paksa berhenti: ${pids}"
    kill -9 ${pids} 2>/dev/null || true
  fi
}

stop_all_ports() {
  stop_port "${PORT}"
  if is_local_storage_enabled; then
    stop_port "${LOCAL_STORAGE_PORT}"
  fi
}

start_local_storage() {
  if ! is_local_storage_enabled; then
    return 0
  fi

  stop_port "${LOCAL_STORAGE_PORT}"
  echo "Menjalankan local image storage di http://${LOCAL_STORAGE_HOST}:${LOCAL_STORAGE_PORT}"
  LOCAL_STORAGE_HOST="${LOCAL_STORAGE_HOST}" LOCAL_STORAGE_PORT="${LOCAL_STORAGE_PORT}" node scripts/local-storage-server.mjs >"${STORAGE_LOG_FILE}" 2>&1 &
}

start_app() {
  stop_all_ports
  start_local_storage
  echo "Menjalankan ${APP_NAME} di http://localhost:${PORT}"

  trap 'echo; echo "Menghentikan ${APP_NAME}..."; stop_all_ports; exit 130' INT TERM
  pnpm exec vite --host "${HOST}" --port "${PORT}" --strictPort
}

case "${command}" in
  start)
    start_app
    ;;
  stop)
    stop_all_ports
    ;;
  restart)
    start_app
    ;;
  status)
    pids="$(port_pids)"
    storage_pids="$(port_pids "${LOCAL_STORAGE_PORT}")"
    if [[ -z "${pids}" ]]; then
      echo "${APP_NAME} tidak berjalan di port ${PORT}."
    else
      echo "${APP_NAME} berjalan di port ${PORT}. PID: ${pids}"
    fi
    if is_local_storage_enabled; then
      if [[ -z "${storage_pids}" ]]; then
        echo "Local image storage tidak berjalan di port ${LOCAL_STORAGE_PORT}."
      else
        echo "Local image storage berjalan di port ${LOCAL_STORAGE_PORT}. PID: ${storage_pids}"
      fi
    fi
    ;;
  logs)
    if [[ -f "${LOG_FILE}" || -f "${STORAGE_LOG_FILE}" ]]; then
      tail -f "${LOG_FILE}" "${STORAGE_LOG_FILE}" 2>/dev/null
    else
      echo "Belum ada log di ${LOG_FILE}."
    fi
    ;;
  build)
    pnpm build
    ;;
  lint)
    pnpm lint
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|logs|build|lint}"
    exit 1
    ;;
esac
