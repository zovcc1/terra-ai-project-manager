#!/bin/bash
set -e

# Check if Maven deps are already cached in the volume
if [ -d "/root/.m2/repository" ] && [ "$(ls -A /root/.m2/repository 2>/dev/null)" ]; then
    echo "[terra-backend] Maven dependencies already cached — skipping download."
else
    echo "[terra-backend] First run — Maven dependencies will be downloaded (~3-5 min)..."
fi

# Check if port 8080 is already in use (backend already running)
if (echo >/dev/tcp/localhost/8080) 2>/dev/null; then
    echo "[terra-backend] Port 8080 is already in use — backend is already running."
    exit 0
fi

exec mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Djava.security.egd=file:/dev/./urandom"
