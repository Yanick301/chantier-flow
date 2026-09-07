# Déploiement Chantier Flow sur Oracle Cloud Free Tier

## 1. Créer le compte Oracle Cloud

1. Aller sur [oracle.com/cloud/free](https://www.oracle.com/cloud/free/)
2. Cliquer "Start for Free"
3. Créer un compte (email, mot de passe)
4. Ajouter une carte bancaire (pas débitée)
5. Choisir **Home Region** = `Europe (Paris)` ou `Africa (Johannesburg)` (proche du Bénin)
6. Créer le compartment et la VM

## 2. Créer l'instance VM

Dans la console Oracle Cloud :

1. **Compute → Instances → Create Instance**
2. Nom : `chantier-flow`
3. **Image** : Ubuntu 22.04 (ou 24.04)
4. **Shape** : VM.Standard.A1.Flex (ARM)
   - OCPUs : 2
   - RAM : 4 Go
5. **Clé SSH** : Uploader ta clé publique (`~/.ssh/id_rsa.pub`)
6. **Vérrouillage dédié** : Désactivé
7. **Ports de sécurité** :
   - Ingress Rules : `22` (SSH), `80` (HTTP), `443` (HTTPS)
8. Cliquer **Create**

## 3. Connexion SSH

```bash
# Attendre 2-3 min après création
ssh -i ~/.ssh/id_rsa ubuntu@<IP_PUBLIQUE_VM>
```

## 4. Installer les dépendances

```bash
# Mise à jour
sudo apt update && sudo apt upgrade -y

# Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Nginx
sudo apt install -y nginx

# Git
sudo apt install -y git

# PM2 (gestionnaire de process)
sudo npm install -g pm2

# Vérifier
node -v && npm -v && nginx -v
```

## 5. Déployer l'app

```bash
# Créer le dossier
sudo mkdir -p /var/www/chantier-flow
sudo chown $USER:$USER /var/www/chantier-flow

# Cloner ou copier le projet
cd /var/www/chantier-flow

# Option A : Copier depuis ta machine locale
# (dans un autre terminal, depuis /home/all/Bureau/compta)
scp -r ./* ubuntu@<IP_VM>:/var/www/chantier-flow/

# Option B : Si le code est sur GitHub
# git clone <URL_REPO> .

# Installer les dépendances
cd server && npm install --production && cd ..
cd client && npm install && npm run build && cd ..

# Lancer le serveur
cd server
pm2 start "npx ts-node src/index.ts" --name chantier-api
pm2 save
pm2 startup  # puis copier la commande affichée
cd ..
```

## 6. Configurer Nginx (reverse proxy)

```bash
sudo tee /etc/nginx/sites-available/chantier-flow > /dev/null << 'EOF'
server {
    listen 80;
    server_name chantierflow.com www.chantierflow.com;

    client_max_body_size 10M;

    # Frontend (fichiers construits)
    location / {
        root /var/www/chantier-flow/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads
    location /uploads/ {
        alias /var/www/chantier-flow/server/uploads/;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/chantier-flow/client/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Activer le site
sudo ln -sf /etc/nginx/sites-available/chantier-flow /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Tester et redémarrer
sudo nginx -t && sudo systemctl reload nginx
```

## 7. SSL avec Let's Encrypt (HTTPS)

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir le certificat
sudo certbot --nginx -d chantierflow.com -d www.chantierflow.com

# Auto-renouvellement
sudo systemctl enable certbot.timer
```

## 8. Domaine (optionnel mais recommandé)

Si tu n'as pas de domaine, tu peux :
- **Option A** : Acheter un domaine cheap (~$1/an) sur [Namecheap](https://www.namecheap.com/) ou [Porkbun](https://porkbun.com/)
- **Option B** : Utiliser l'IP directe : `http://<IP_PUBLIQUE_VM>`

Pour configurer le domaine :
1. Acheter le domaine
2. DNS A Record → `<IP_PUBLIQUE_VM>`
3. DNS CNAME www → `<IP_PUBLIQUE_VM>` ou `chantierflow.com`
4. Attendre 5-10 min que la propagation DNS se fasse
5. Lancer `sudo certbot --nginx -d chantierflow.com -d www.chantierflow.com`

## 9. Sécuriser le serveur

```bash
# Fail2ban (protection brute force)
sudo apt install -y fail2ban
sudo systemctl enable fail2ban

# Pare-feu UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# SSH : désactiver le login par mot de passe
sudo nano /etc/ssh/sshd_config
# Changer : PasswordAuthentication no
# Puis : sudo systemctl restart sshd
```

## 10. Commandes utiles

```bash
# Voir les logs
pm2 logs chantier-api

# Redémarrer l'API
pm2 restart chantier-api

# Mettre à jour l'app
cd /var/www/chantier-flow
git pull  # ou recopier les fichiers
cd client && npm run build && cd ..
pm2 restart chantier-api

# Voir le statut
pm2 status

# Voir les logs Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## Résumé

| Étape | Commande |
|---|---|
| VM créée | Ubuntu 22.04, 2 OCPU, 4 Go RAM |
| Node.js | `curl -fsSL https://deb.nodesource.com/setup_18.x \| sudo -E bash -` |
| PM2 | `pm2 start "npx ts-node src/index.ts" --name chantier-api` |
| Nginx | Reverse proxy vers port 3001 |
| SSL | `sudo certbot --nginx -d domain.com` |
| Domaine | A Record → IP VM |

**Résultat** : App accessible sur `https://chantierflow.com` (ou IP directe), HTTPS, 24/7, gratuit pour toujours.
