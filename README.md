# TaskFlow

Application de gestion de tâches (Todo App) moderne et responsive, construite en **HTML5, CSS3 et JavaScript vanilla** — sans framework.

## Démo en ligne

- GitHub Pages : https://massandie.github.io/TODO-app/
- Netlify : https://taskflow-massandie.netlify.app

## Fonctionnalités

- Inscription / connexion (authentification locale, voir [Limites](#limites) ci-dessous).
- Ajout, modification, suppression de tâches, avec confirmation avant suppression.
- Marquage des tâches comme terminées.
- Filtres : toutes / actives / terminées, par catégorie, par priorité.
- Recherche par titre et tri (date, priorité, date de création).
- Tableau de bord avec statistiques (total, terminées, restantes) et barre de progression.
- Vue "Catégories" et vue "Statistiques" (répartition par priorité/catégorie).
- Mode clair / sombre mémorisé.
- Notifications et confirmations à chaque action.
- Interface entièrement responsive (desktop, tablette, mobile).
- Sauvegarde automatique dans `localStorage`, propre à chaque compte.

## Structure du projet

```
projet todo/
├── index.html   # Structure HTML (sidebar, header, dashboard, modales)
├── style.css    # Design, thèmes clair/sombre, responsive
├── script.js    # Logique : CRUD, filtres, auth, localStorage
├── spec.md      # Spécification d'un autre projet (lecteur de musique)
└── README.md
```

## Lancer le projet en local

Aucune dépendance ni installation nécessaire : ouvrez simplement `index.html` dans un navigateur, ou utilisez l'extension **Live Server** de VS Code pour un rechargement automatique.

## Limites

L'authentification (inscription/connexion) est gérée **entièrement côté navigateur** (`localStorage`), avec mot de passe hashé (SHA-256 via Web Crypto). C'est un mécanisme de démonstration adapté à un portfolio, mais il n'y a ni serveur ni base de données réelle : à ne pas utiliser pour stocker de vraies données sensibles.

## Auteur

Projet réalisé par mkone.
