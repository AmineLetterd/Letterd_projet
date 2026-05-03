# LETTERD

Une application web permettant principalement d’attribuer une note personnelle à vos films et séries du moment.

## Installation & Lancement

Prérequis : Node.js + npm

```bash
cd letterd
npm install
npm start
```

Puis ouvrir `http://localhost:3000` dans le navigateur. La BD SQLite se crée toute seule au premier lancement.

## Á l'intérieur

- **Backend** : Express.js sur le port 3000
- **Frontend** : HTML/CSS/JS
- **BD** : SQLite (fichier `database.db`)
- **API** : TMDB pour les films/séries

## Comment ça marche

### Sans compte
- Voir le catalogue
- Chercher/filtrer les films
- Voir les détails
- C'est tout 😄

### Avec un compte
- Créer un compte (pseudo + email + mdp)
- Ajouter des films à ta liste
- Noter les films (0-10)
- Voir tes stats (total, moyenne, etc.)
- Modifier son profil

## Structure

```
test/
├── index.js                  # Serveur
├── database.db              # BD SQLite
├── public/
│   ├── *.html               # 4 pages
│   ├── styles/              # CSS
│   └── scripts/             # JS
```

## Pages

- `index.html` → Accueil + login/signup
- `tableau-de-bord.html` → Catalogue (connecté)
- `ma-liste.html` → Ta liste personnelle
- `profil.html` → Ton profil

## Points Techniques

- Authentification simple (stockage des mots de passe)
- localStorage pour garder la session
- Une seule BD avec 2 tables : `users` et `user_items`
- Tous les films viennent de TMDB

## Problèmes ?

- **Serveur ne démarre** : `npm install` puis `npm start`
- **Films qui s'affichent pas** : Vérifier la connexion internet et que le serveur tourne
- **Redirection bizarre** : Regarder la console du navigateur