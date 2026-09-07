#!/bin/bash
# Chantier Flow - Démarrage complet avec tunnel Internet
BASEDIR="/home/all/Bureau/compta"
LOGDIR="$BASEDIR/logs"
mkdir -p "$LOGDIR"

echo "=== Arrêt des processus existants ==="
pkill -f "ts-node.*index.ts" 2>/dev/null
nginx -s stop -c "$BASEDIR/nginx.conf" 2>/dev/null
pkill -f "localtunnel" 2>/dev/null
pkill -f "cloudflared" 2>/dev/null
sleep 1

echo "=== Démarrage du serveur API (port 3001) ==="
cd "$BASEDIR/server"
nohup npx ts-node src/index.ts > "$LOGDIR/server.log" 2>&1 &
SERVER_PID=$!
echo "  PID: $SERVER_PID"
sleep 3

if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
  echo "  Serveur API: OK"
else
  echo "  ERREUR: Serveur API ne démarre pas"
  exit 1
fi

echo "=== Démarrage de Nginx (port 8080) ==="
mkdir -p /tmp/nginx_chantier/{body,proxy,fastcgi,uwsgi,scgi}
nginx -c "$BASEDIR/nginx.conf" 2>&1
echo "  Nginx: OK"

# Tunnel Internet via localtunnel
echo "=== Démarrage du tunnel Internet ==="
nohup npx -y localtunnel --port 8080 > "$LOGDIR/tunnel.log" 2>&1 &
TUNNEL_PID=$!
sleep 6
TUNNEL_URL=$(grep -oP 'https://[a-z0-9-]+\.loca\.lt' "$LOGDIR/tunnel.log" | head -1)

LAN_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "======================================================="
echo "  CHANTIER FLOW - Pret !"
echo "======================================================="
echo ""
echo "  Acces local:      http://localhost:8080"
echo "  Acces reseau:     http://$LAN_IP:8080"
if [ -n "$TUNNEL_URL" ]; then
  echo "  Acces Internet:   $TUNNEL_URL"
  echo ""
  echo "  >>> Partagez cette URL aux autres utilisateurs <<<"
  echo ""
fi
echo "  Login:   admin@chantierflow.com"
echo "  MDP:     admin123"
echo ""
echo "  Logs: $LOGDIR/"
echo "  Arreter: bash $BASEDIR/stop.sh"
echo "======================================================="
