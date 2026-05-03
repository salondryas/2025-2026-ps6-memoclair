# Compilation des Changements Techniques à Faire — Synthèse des Retours d'Experts

## Priorité 1 — Unifier la source de vérité du patient actif

**Constat**  
Le patient courant est géré de manière incohérente entre les pages, ce qui fragilise toute la maquette.

**Actions à mener**
- Définir une convention unique:
  - `localStorage.selectedPatient` pour le nom affiché partout
  - `sessionStorage.activePatient` pour l'identifiant courant des jeux
- Synchroniser navbar, sélection patient, espace famille, stats et jeux.
- Utiliser partout les mêmes trois patients.

**Fichiers concernés**
- `maquette/components/mc-navbar.js`
- `maquette/pages/games/patient-selection.html`
- `maquette/pages/aidant/dashboard-familial.html`
- `maquette/pages/aidant/dashboard-familial.js`
- `maquette/pages/aidant/role-selection.js`
- `maquette/pages/statistics/statistics.js`
- `maquette/pages/games/game-a.js`
- `maquette/pages/games/game-b.js`
- `maquette/pages/games/game-duo.js`

---

## Priorité 2 — Remplacer la logique de quiz codée en dur par des structures de séance plus cohérentes

**Constat**  
Les jeux et les statistiques sont encore pilotés par des structures locales hétérogènes et orientées performance.

**Actions à mener**
- Définir des objets de séance plus cohérents pour les jeux et pour la vue stats.
- Remplacer les notions de score / erreur par des notions d'observation et d'accompagnement.
- Rendre le jeu B et le duo plus data-driven.

**Fichiers concernés**
- `maquette/pages/games/game-a.js`
- `maquette/pages/games/game-b.js`
- `maquette/pages/games/game-duo.js`
- `maquette/pages/statistics/statistics.js`

---

## Priorité 3 — Refondre la page Profil autour d'un vrai modèle patient

**Constat**  
Le profil actuel est un écran de réglage technique. Il doit devenir la représentation simple d'une posture de séance.

**Actions à mener**
- Stocker un objet profil clair:
  - `stage`
  - `vision`
  - `motor`
  - `themes`
  - `attention`
- Faire apparaître un résumé lisible de ce profil.
- Rendre les effets du profil réutilisables ailleurs dans la maquette.

**Fichiers concernés**
- `maquette/pages/aidant/profile.html`
- `maquette/pages/aidant/profile.js`
- `maquette/pages/aidant/profile.css`

---

## Priorité 4 — Structurer un minimum les médias personnels

**Constat**  
La galerie actuelle ne stocke pratiquement que des noms de fichiers et des types.

**Actions à mener**
- Conserver au minimum:
  - `name`
  - `type`
  - origine personnelle/générique
- Réinjecter les thèmes du profil dans la page médias.
- Permettre au jeu B d'exploiter clairement les médias importés.

**Fichiers concernés**
- `maquette/pages/aidant/media.html`
- `maquette/pages/aidant/media.js`
- `maquette/pages/games/game-b.js`

---

## Priorité 5 — Corriger les incohérences de parcours et de texte

**Constat**  
Plusieurs experts pointent surtout un défaut de cohérence interne.

**Actions à mener**
- Harmoniser le lexique:
  - supprimer "taux de réussite", "bonne réponse", "très bien joué"
  - privilégier "repères de séance", "souvenir", "accompagnement"
- Rendre les jeux cohérents avec les pages aidant.
- Rendre la fin de séance compatible avec la promesse non évaluative.

**Fichiers concernés**
- `maquette/pages/statistics/statistics.html`
- `maquette/pages/statistics/statistics.js`
- `maquette/pages/games/game-a.js`
- `maquette/pages/games/game-b.html`
- `maquette/pages/games/game-b.js`
- `maquette/pages/games/game-duo.html`
- `maquette/pages/games/game-end.html`

---

## Priorité 6 — Supprimer les dépendances les plus fragiles

**Constat**  
Certaines pages dépendent de comportements implicites ou de chemins fragiles.

**Actions à mener**
- Corriger les chemins d'assets incohérents.
- Réduire les dépendances à des `onclick` inline lorsque cela gêne la robustesse.
- Prévoir des fallbacks lorsque les données de stockage sont absentes ou invalides.
- Sécuriser les lectures de `localStorage`.

**Fichiers concernés**
- `maquette/pages/games/game-b.js`
- `maquette/pages/games/patient-selection.html`
- `maquette/pages/aidant/media.js`
- `maquette/pages/aidant/profile.js`
- `maquette/pages/statistics/statistics.js`

---

## Priorité 7 — Rendre l'accessibilité plus structurelle

**Constat**  
L'accessibilité est encore trop portée par des réglages isolés.

**Actions à mener**
- Conserver des cibles larges et homogènes.
- Stabiliser les patterns d'interaction et les annonces d'état.
- Faire en sorte que les feedbacks n'utilisent pas seulement la couleur ou l'évaluation.

**Fichiers concernés**
- `maquette/pages/aidant/profile.css`
- `maquette/pages/games/game-b.css`
- `maquette/pages/games/game-duo.css`
- `maquette/pages/games/game-end.css`
- `maquette/pages/statistics/statistics.css`

---

## Priorité 8 — Corriger les styles structurels à faible coût mais à fort effet

**Constat**  
Quelques feuilles de style contiennent des règles partielles ou contradictoires qui nuisent à la stabilité du layout.

**Actions à mener**
- Vérifier les pages où `body` utilise des propriétés flex sans `display: flex`.
- Uniformiser le centrage et les largeurs maximales utiles.
- Éviter les styles inline temporaires quand une classe dédiée suffit.

**Fichiers concernés**
- `maquette/pages/games/game-b.css`
- `maquette/pages/games/game-end.css`
- `maquette/pages/games/games.css`

---

## Décision d'implémentation retenue

Les changements techniques à coder maintenant dans la maquette sont:
- unification du patient actif
- refonte data et copy de `statistics`
- refonte structurelle de `profile`
- enrichissement léger mais exploitable de `media`
- refonte de `game-b` et `game-duo`
- enrichissement de `game-a`
- adoucissement de `game-end`
- corrections de cohérence et de layout à fort ROI

