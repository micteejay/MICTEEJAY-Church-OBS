#!/bin/bash
export DISPLAY="${DISPLAY:-:0}"

# Start Bible Song Pro local service if not already running
if ! pgrep -f "server/bsp-service.js" > /dev/null; then
    node /home/MICTEEJAY/Projects/MICTEEJAY-Church-OBS/Bible-Song-Pro/server/bsp-service.js > /tmp/bsp-service.log 2>&1 &
    sleep 0.5
fi

cd /home/MICTEEJAY/Projects/MICTEEJAY-Church-OBS/obs-studio/build_ubuntu/rundir/Debug/bin
exec ./obs "$@"
