# Déploiement Chantier Flow sur Render (Gratuit, sans carte bancaire)

## Prérequis

- Un compte GitHub
- Le code du projet sur GitHub

## Étape 1 : Créer un dépôt GitHub

1. Aller sur [github.com/new](https://github.com/new)
2. Nom : `chantier-flow`
3. **Public** (pour le déploiement gratuit sur Render)
4. Uploader le projet :

```bash
cd /home/all/Bureau/compta
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TON_UTILISATEUR/chantier-flow.git
git push -u origin main
```

## Étape 2 : Créer un compte Render

1. Aller sur [render.com](https://render.com)
2. Cliquer **Get Started for Free**
3. Créer un compte avec GitHub (pas de carte bancaire)

## Étape 3 : Créer le service

1. Dashboard → **New +** → **Web Service**
2. Connecter le dépôt GitHub `chantier-flow`
3. Configurer :
   - **Name** : `chantier-flow`
   - **Runtime** : Node
   - **Build Command** :
     ```
     cd client && npm install && npm run build && cd ../server && npm install && npm run build
     ```
   - **Start Command** :
     ```
     cd server && node dist/index.js
     ```
   - **Plan** : Free
4. Cliquer **Create Web Service**

## Étape 4 : Variables d'environnement

Dans l'onglet **Environment** du service :

| Clé | Valeur |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | (générer un mot de passe aléatoire) |

Pour générer un JWT_SECRET :
```bash
openssl rand -hex 32
```

## Étape 5 : Accéder à l'app

1. Attendre le build (~2-3 min)
2. L'app sera accessible sur : `https://chantier-flow.onrender.com`
3. Login : `admin@chantierflow.com` / `admin123`

## ⚠️ Limitations du plan gratuit Render

| Limite | Détail |
|---|---|
| **Cold start** | L'app se met en veille après 15 min d'inactivité |
| **Premier accès** | 30-60 secondes de chargement au réveil |
| **SQLite éphémère** | La base de données est perdue à chaque redéarrmage |
| **RAM** | 512 Mo |
| **Builds** | 500 min/mois |

### ⚠️ Problème SQLite

Render a un filesystem **éphémère** : la base SQLite est perdue à chaque redéarrmage ou update.

**Solution recommandée** : Utiliser PostgreSQL sur Render (gratuit 90 jours) :
1. Créer un service **PostgreSQL** sur Render
2. Copier la connection string
3. Ajouter `DATABASE_URL` dans les variables d'environnement

**Alternative** : Accepter que la base SQLite soit réinitialisée à chaque redéarrmage (l'admin est recréé automatiquement).

## Étape 6 : Mettre à jour l'app

```bash
git add .
git commit -m "Mise à jour"
git push
```

Render redéploie automatiquement si **Auto Deploy** est activé.

## Commandes utiles

```bash
# Voir les logs sur Render
# → Dashboard → chantier-flow → Logs

# Forcer un redéploiement
# → Dashboard → chantier-flow → Manual Deploy → Clear build cache & deploy
```
