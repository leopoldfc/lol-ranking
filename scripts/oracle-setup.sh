#!/bin/bash
# Script de setup initial sur la VM Oracle Free Tier (Ubuntu 22.04/24.04 ARM)

set -e
REPO_URL="https://github.com/leopoldfc/lol-rating"
APP_DIR="/home/ubuntu/lol-ranking"
WEB_DIR="/var/www/lol-ranking"

echo "=== 1. Installation des dépendances système ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx

echo "=== 2. Clone du repo ==="
git clone "$REPO_URL" "$APP_DIR"
# Si le repo est privé, utilise : git clone https://<token>@github.com/leopoldfc/lol-rating "$APP_DIR"
cd "$APP_DIR"

echo "=== 3. Installation des dépendances Node ==="
npm install
cd frontend && npm install && cd ..

echo "=== 4. Premier build ==="
npm run scrape:2026
npm run news
cd frontend && npm run build && cd ..

echo "=== 5. Déploiement des fichiers statiques ==="
sudo mkdir -p "$WEB_DIR"
sudo cp -r frontend/dist/* "$WEB_DIR/"
sudo chown -R ubuntu:ubuntu "$WEB_DIR"

echo "=== 6. Configuration Nginx ==="
sudo cp scripts/nginx-lol-ranking.conf /etc/nginx/sites-available/lol-ranking
sudo ln -sf /etc/nginx/sites-available/lol-ranking /etc/nginx/sites-enabled/lol-ranking
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "=== 7. Permissions sudo sans mot de passe pour cp vers /var/www ==="
echo "ubuntu ALL=(ALL) NOPASSWD: /bin/cp -r * $WEB_DIR/" | sudo tee /etc/sudoers.d/lol-ranking
sudo chmod 440 /etc/sudoers.d/lol-ranking

echo "=== 8. Cron quotidien à 4h UTC ==="
chmod +x "$APP_DIR/scripts/daily-update.sh"
(crontab -l 2>/dev/null; echo "0 4 * * * $APP_DIR/scripts/daily-update.sh >> /home/ubuntu/scrape.log 2>&1") | crontab -

echo ""
echo "=== Setup terminé ! ==="
echo "Ton app est disponible sur http://$(curl -s ifconfig.me)"
echo "Logs : tail -f /home/ubuntu/scrape.log"
