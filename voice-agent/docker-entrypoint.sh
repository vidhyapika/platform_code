#!/bin/sh
while true; do
  node dist/index.js start
  echo "[voice-agent] worker exited, restarting in 3s..."
  sleep 3
done
