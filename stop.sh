#!/bin/bash
# Arrêter Chantier Flow
echo "Arrêt de Chantier Flow..."
pkill -f "ts-node.*index.ts" 2>/dev/null && echo "  Serveur API arrêté" || echo "  Serveur API déjà arrêté"
pkill -f "localtunnel" 2>/dev/null && echo "  Tunnel arrêté" || echo "  Tunnel déjà arrêté"
nginx -s stop -c /home/all/Bureau/compta/nginx.conf 2>/dev/null && echo "  Nginx arrêté" || echo "  Nginx déjà arrêté"
echo "Terminé."
