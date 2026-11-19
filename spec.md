# Spécification — Lecteur de Musique Web

Application web de lecture de musique en ligne : recherche de morceaux, lecture audio, gestion de playlists et de favoris. HTML5 / CSS3 / JavaScript vanilla (sans framework), sur le même modèle que les autres projets du dossier `Music/`.

## 1. Vue d'ensemble

- Recherche de morceaux via une API publique (métadonnées + pochette + extrait audio).
- Lecture audio pilotée par l'élément `<audio>` / Web Audio API.
- Playlists et favoris persistés en local (`localStorage`), pas de backend.
- Interface type lecteur moderne (sidebar + mini-player fixe en bas de page).

## 2. Fonctionnalités

### Recherche & découverte
- Recherche par titre, artiste ou album.
- Résultats paginés avec pochette, titre, artiste, durée.
- Lecture d'un extrait directement depuis les résultats de recherche.

### Lecture audio
- Play / Pause / Stop.
- Piste suivante / précédente.
- Barre de progression cliquable (seek) avec temps écoulé / temps restant.
- Contrôle du volume + mute.
- Lecture aléatoire (shuffle).
- Répétition : aucune / piste en boucle / file en boucle.
- Reprise automatique de la piste suivante en fin de lecture.

### Playlists & organisation
- Création, renommage, suppression de playlists personnalisées.
- Ajout / retrait d'un morceau à une playlist.
- Réorganisation des morceaux dans une playlist (glisser-déposer).
- Favoris ("Titres likés").
- Historique des morceaux récemment écoutés.
- File d'attente (queue) consultable et modifiable.

### Interface & confort d'usage
- Mode clair / sombre, mémorisé.
- Visualiseur audio animé (barres réactives au son, Web Audio API).
- Raccourcis clavier : `Espace` (play/pause), `←/→` (piste préc./suiv.), `↑/↓` (volume).
- Notifications toast après chaque action (ajout playlist, favori, erreur réseau...).
- Responsive : desktop, tablette, mobile (sidebar en menu rétractable).
- États vides explicites (aucune playlist, aucun résultat, aucun favori).

## 3. Composants d'interface (UI)

| Composant | Rôle |
|---|---|
| `Sidebar` | Navigation : Accueil, Recherche, Playlists, Favoris, Historique, thème |
| `SearchBar` | Champ de recherche + déclenchement des requêtes API |
| `ResultsList` | Liste des morceaux retournés par la recherche |
| `TrackRow` | Ligne de morceau réutilisable (pochette, titre, artiste, durée, actions) |
| `PlayerBar` | Mini-lecteur fixe en bas : pochette, titre/artiste, contrôles, progression, volume |
| `QueuePanel` | Panneau latéral de la file d'attente courante |
| `PlaylistView` | Détail d'une playlist (liste de `TrackRow` + actions) |
| `PlaylistModal` | Modale de création / renommage de playlist |
| `AudioVisualizer` | Visualisation animée du son en cours de lecture |
| `ToastContainer` | Zone d'affichage des notifications |
| `EmptyState` | Message + illustration pour les listes vides |

## 4. API externes utilisées

| API | Usage | Authentification |
|---|---|---|
| **iTunes Search API** (`itunes.apple.com/search`) | Recherche de morceaux, métadonnées, pochette, extrait audio de 30s (`previewUrl`) | Aucune (gratuite, sans clé) |
| **Deezer API** (optionnel, alternative/complément) | Recherche complémentaire si résultats iTunes insuffisants | Aucune pour les endpoints publics de recherche |
| **Last.fm API** (optionnel, fonctionnalité bonus) | Informations enrichies sur l'artiste (biographie, morceaux similaires) | Clé API requise |
| **Web Audio API** (native navigateur, pas un service externe) | Lecture, contrôle du volume, analyse du signal pour le visualiseur | — |

> Note : les API de recherche publiques (iTunes, Deezer) ne fournissent que des **extraits de 30 secondes**, pas les morceaux complets — à mentionner clairement dans l'UI pour ne pas induire l'utilisateur en erreur.

## 5. Décomposition des fonctions JavaScript clés

### Module recherche (`search.js`)
```js
searchTracks(query)        // Appelle l'API, retourne une liste normalisée de morceaux
normalizeTrackData(raw)    // Convertit la réponse API en objet { id, title, artist, artwork, previewUrl, duration }
renderResults(tracks)      // Injecte les résultats dans ResultsList
debounceSearch(fn, delay)  // Limite la fréquence des appels API pendant la saisie
```

### Module lecteur (`player.js`)
```js
loadTrack(track)           // Charge un morceau dans l'élément <audio> et met à jour PlayerBar
play() / pause() / stop()  // Contrôle de la lecture
seekTo(percent)             // Déplace la lecture à une position donnée
setVolume(value)            // Ajuste le volume (0–1), gère le mute
playNext() / playPrevious() // Avance/recule dans la file d'attente
toggleShuffle() / toggleRepeat() // Bascule les modes de lecture
updateProgressUI()          // Callback sur l'event `timeupdate` de <audio>
handleTrackEnd()             // Déclenche la piste suivante selon le mode répétition/shuffle
```

### Module file d'attente (`queue.js`)
```js
setQueue(tracks, startIndex)  // Remplace la file courante et démarre à un index
addToQueue(track)             // Ajoute un morceau en fin de file
removeFromQueue(trackId)      // Retire un morceau de la file
getCurrentTrack()             // Retourne le morceau en cours selon l'index courant
```

### Module playlists & favoris (`playlists.js`)
```js
createPlaylist(name)             // Crée une playlist vide, persiste dans localStorage
renamePlaylist(id, newName)
deletePlaylist(id)
addTrackToPlaylist(playlistId, track)
removeTrackFromPlaylist(playlistId, trackId)
reorderPlaylistTracks(playlistId, fromIndex, toIndex)
toggleFavorite(track)            // Ajoute/retire un morceau des favoris
isFavorite(trackId)
```

### Module stockage (`storage.js`)
```js
loadPlaylists() / savePlaylists(playlists)
loadFavorites() / saveFavorites(favorites)
loadHistory() / saveHistory(history)
pushToHistory(track)   // Ajoute un morceau en tête d'historique, limite la taille (ex. 50)
```

### Module visualiseur (`visualizer.js`)
```js
initAudioContext(audioElement)   // Crée l'AudioContext + AnalyserNode branché sur <audio>
drawVisualizer()                  // Boucle requestAnimationFrame dessinant les barres sur <canvas>
stopVisualizer()                  // Arrête la boucle d'animation (pause/stop)
```

### Module UI générale (`ui.js`)
```js
showToast(message, type)
openModal(id) / closeModal(id)
applyTheme(theme) / initTheme()
renderQueuePanel(queue)
renderPlaylistSidebar(playlists)
formatDuration(seconds)   // 125 -> "2:05"
```

## 6. Persistance (localStorage)

| Clé | Contenu |
|---|---|
| `musicplayer.playlists` | Tableau des playlists `{ id, name, trackIds[] }` |
| `musicplayer.favorites` | Tableau des morceaux favoris |
| `musicplayer.history` | Historique des morceaux écoutés (liste limitée) |
| `musicplayer.theme` | `light` / `dark` |
| `musicplayer.volume` | Dernier volume utilisé |

## 7. Limites connues

- Pas de lecture de morceaux complets (contrainte des API publiques gratuites utilisées) — uniquement des extraits de 30s.
- Pas de compte utilisateur / synchronisation multi-appareil (tout est local au navigateur).
- Dépendance à la disponibilité et aux quotas des API tierces (pas de clé = pas de garantie de disponibilité).
