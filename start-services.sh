#!/usr/bin/env bash

set -euo pipefail

SESSION="rcw-services"
SERVICES=(
  "api-gateway"
  "admin-service"
  "auth-login-service"
  "auth-register-service"
  "book-catalog-service"
  "order-service"
  "otp-service"
  "payment-service"
  "user-profile-service"
)
FRONTEND_CMD="npm run dev"

if ! command -v tmux &>/dev/null; then
  echo "⚠️  tmux is required to run ${0##*/}. Please install tmux first."
  exit 1
fi

# Clean up previous session
if tmux has-session -t "$SESSION" 2>/dev/null; then
  tmux kill-session -t "$SESSION"
fi

tmux new-session -d -s "$SESSION" -n frontend
tmux send-keys -t "$SESSION:frontend" "cd \"$PWD\" && $FRONTEND_CMD" C-m

for service in "${SERVICES[@]}"; do
  tmux new-window -t "$SESSION" -n "$service"
  tmux send-keys -t "$SESSION:$service" "cd \"$PWD/$service\" && if [ ! -d node_modules ]; then npm install >/dev/null 2>&1; fi && npm run dev" C-m
done

echo "⚙️  tmux session '$SESSION' started with frontend + backend services."
echo "    Attach with: tmux attach-session -t $SESSION"
