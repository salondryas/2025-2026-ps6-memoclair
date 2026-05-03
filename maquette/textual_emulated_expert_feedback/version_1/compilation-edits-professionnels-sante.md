# Compilation des Changements à Faire — Synthèse des Retours de Professionnels de Santé

## Priorité 1 — Retirer la logique de performance visible

**Constat récurrent**  
Les professionnels relèvent presque unanimement que la vue statistiques actuelle et certains feedbacks de jeu restent trop proches d'un modèle de quiz ou d'évaluation.

**Changements attendus**
- Remplacer le vocabulaire de réussite, erreur, score, autonome/guidage requis par des repères de séance.
- Afficher un avertissement clair: ces données ne remplacent ni le MMSE ni l'ADL et ne servent pas au diagnostic.
- Centrer la vue aidant sur le confort de séance, l'engagement, le besoin d'accompagnement, le moment d'arrêt et la suite à proposer.
- Adoucir les feedbacks visibles côté patient et l'écran de fin de séance.

**Fichiers principalement concernés**
- `maquette/pages/statistics/statistics.html`
- `maquette/pages/statistics/statistics.js`
- `maquette/pages/statistics/statistics.css`
- `maquette/pages/games/game-a.js`
- `maquette/pages/games/game-b.js`
- `maquette/pages/games/game-end.html`

---

## Priorité 2 — Recentrer le Jeu B sur la réminiscence et non sur la bonne réponse

**Constat récurrent**  
Le jeu B est perçu comme le principal angle mort du projet: il reste trop orienté reconnaissance correcte d'un visage ou d'un souvenir, alors que le brief appelle une évocation souple, conversationnelle et protégée de l'échec.

**Changements attendus**
- Transformer les questions fermées en invitations au souvenir ou à l'impression.
- Retirer la logique vrai/faux visible pour le patient.
- Prévoir un fallback convaincant avec médias génériques si aucun média personnel n'est disponible.
- Autoriser le passage au souvenir suivant sans coût symbolique.
- Faire apparaître des amorces d'accompagnement et de reformulation plutôt que des corrections.

**Fichiers principalement concernés**
- `maquette/pages/games/game-b.html`
- `maquette/pages/games/game-b.js`
- `maquette/pages/games/game-b.css`

---

## Priorité 3 — Refaire le mode duo comme support de conversation

**Constat récurrent**  
Le mode duo est jugé prometteur mais mal orienté: il compare encore trop des réponses au lieu de soutenir discrètement le proche.

**Changements attendus**
- Remplacer la logique "aidant répond / patient répond" par une logique "aidant choisit une posture d'accompagnement".
- Ajouter des suggestions concrètes: laisser du silence, nommer un détail, répondre avec lui, passer au souvenir suivant.
- Retirer la mise en scène de l'accord/désaccord comme résultat.
- Faire du duo un vrai espace de médiation relationnelle.

**Fichiers principalement concernés**
- `maquette/pages/games/game-duo.html`
- `maquette/pages/games/game-duo.js`
- `maquette/pages/games/game-duo.css`

---

## Priorité 4 — Aligner la page Profil avec les 5 repères du brief

**Constat récurrent**  
La page profil actuelle est perçue comme un panneau de réglages techniques de quiz, pas comme une préparation rapide d'une séance Alzheimer-friendly.

**Changements attendus**
- Remplacer les presets difficile / moyen / facile par les 5 repères du brief:
  - stade observé
  - troubles visuels
  - difficultés motrices
  - thèmes porteurs
  - durée d'attention
- Générer un résumé simple de posture de séance.
- Enregistrer le profil de manière persistante pour chaque patient.

**Fichiers principalement concernés**
- `maquette/pages/aidant/profile.html`
- `maquette/pages/aidant/profile.js`
- `maquette/pages/aidant/profile.css`

---

## Priorité 5 — Faire des médias une vraie bibliothèque de souvenirs

**Constat récurrent**  
La page médias est jugée trop proche d'un simple espace d'upload de fichiers.

**Changements attendus**
- Ajouter des conseils visibles sur ce qu'est un "bon souvenir support".
- Réinjecter les thèmes porteurs renseignés dans le profil.
- Rendre les médias personnels plus clairement reliés à une future conversation de réminiscence.
- Conserver un fonctionnement simple pour ne pas alourdir les proches.

**Fichiers principalement concernés**
- `maquette/pages/aidant/media.html`
- `maquette/pages/aidant/media.js`
- `maquette/pages/aidant/media.css`

---

## Priorité 6 — Uniformiser le patient actif dans toute la maquette

**Constat récurrent**  
Plusieurs professionnels ont pointé une incohérence de contexte entre pages aidant, jeux et statistiques.

**Changements attendus**
- Synchroniser le patient choisi dans l'espace jeux et dans l'espace aidant.
- Utiliser partout les mêmes trois patients.
- Éviter les changements silencieux de patient selon la page visitée.

**Fichiers principalement concernés**
- `maquette/components/mc-navbar.js`
- `maquette/pages/games/patient-selection.html`
- `maquette/pages/aidant/dashboard-familial.html`
- `maquette/pages/aidant/dashboard-familial.js`
- `maquette/pages/aidant/role-selection.js`
- `maquette/pages/statistics/statistics.js`

---

## Priorité 7 — Rendre le Jeu A plus crédible et moins répétitif

**Constat récurrent**  
Le jeu A est bien accueilli sur le fond mais encore jugé démonstratif, car trop répétitif et parfois encore trop correctif dans ses messages.

**Changements attendus**
- Prévoir plusieurs questions par patient au lieu d'une répétition artificielle.
- Garder un ton de guidance doux, sans valider ou invalider trop fortement.
- Maintenir des séances courtes et progressives.

**Fichiers principalement concernés**
- `maquette/pages/games/game-a.js`

---

## Priorité 8 — Adoucir les transitions et les fins de séance

**Constat récurrent**  
Les professionnels veulent une fin de séance plus apaisée, plus relationnelle et moins performative.

**Changements attendus**
- Remplacer "Bravo" et "Vous avez très bien joué" par un message de clôture calme.
- Valoriser le moment partagé et la possibilité de revenir plus tard.

**Fichiers principalement concernés**
- `maquette/pages/games/game-end.html`

---

## Éléments à faible ROI pour l'instant

- Refonte visuelle lourde
- Ajout de nouveaux jeux
- Raffinement graphique pur
- Système de comptes
- Statistiques longitudinales complexes

---

## Décision d'implémentation recommandée

Les modifications à coder en priorité dans la maquette sont:
- refonte de `statistics`
- refonte de `game-b`
- refonte de `game-duo`
- refonte de `profile`
- enrichissement de `media`
- synchronisation du patient actif
- adoucissement de `game-a` et `game-end`

