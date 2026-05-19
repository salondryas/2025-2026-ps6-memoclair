# Audit transparent — Jeux A & B (Angular)

Date: 2026-05-19

## Cadre et méthode

- **Périmètre lu**: routing jeux, pages Jeu A / Jeu B, services de session, composants partagés UI (mascotte, audio-help, hint, choices), styles SCSS principaux.
- **Méthode**: revue statique code (TS/HTML/SCSS), identification causes racines, évaluation impact patient/aidant, priorisation correctifs.
- **Niveaux de sévérité**: Critique / Majeur / Modéré / Mineur.
- **Transparence**:
  - **Observé** = visible dans code.
  - **Inféré** = probable mais non prouvé sans tests runtime.
  - **Recommandé** = action priorisée.

---

## A) Cohérence fonctionnelle utilisateur

### Observé
- Jeu B gère bien les états clés: `loading`, question active, `locked`, `finished`, `pause`, `hint`, skip, feedback et auto-next.  
- Le flow est compréhensible mais les transitions sont **temporellement rigides** (`5000ms` auto-next pour bonne/mauvaise réponse et skip).  
- Le bouton « Question suivante » coexiste avec auto-next, créant parfois un double modèle d’interaction.

### Risques utilisateur
- Senior + aidant: rythme potentiellement trop rapide/lent selon profil cognitif.
- Risque de perte de contrôle perçue si la navigation avance automatiquement pendant hésitation/lecture.

### Recommandé
- Introduire un mode **auto-next configurable** via profil (off / 5s / 8s / manuel).
- Afficher un micro-compte à rebours avant passage automatique.

---

## B) Logique métier et robustesse

### Observé
- Jeu B: génération locale puis fusion éventuelle avec questions backend; logique de slicing/choices dépend du profil.
- Jeu A: génération des distracteurs et normalisation semblent structurées, mais forte densité de données inline.
- Réduction des choix basée sur `answerCount` peut réduire variabilité si banque limitée.

### Risques
- **Inféré**: comportements non homogènes si `questionCount/answerCount` sortent des bornes attendues.
- **Inféré**: mélange questions locales + backend peut déséquilibrer difficulté/ton s’il n’existe pas de post-normalisation métier stricte.

### Recommandé
- Ajouter validateur central `sanitizeProfileGameConfig()` pour borner explicitement (`min/max`) `questionCount`, `answerCount`, timers.
- Ajouter post-traitement des questions fusionnées (type balance, difficulté, diversité média).

---

## C) UX/UI (lisibilité, hiérarchie, collisions, responsive)

### Observé
- Cause racine mascotte Jeu B: style enfant `max-height: 40vh` peut contredire les réglages parent.
- Style Jeu B contient plusieurs blocs responsive potentiellement redondants (risque divergence).
- Densité verticale forte (media + question + hint + feedback + choices) sur petits écrans.

### Risques
- Collisions visuelles mascotte/texte possibles selon ratio écran.
- Fatigue visuelle seniors si question + choix trop compacts.

### Recommandé
- Stratégie stable mascotte:
  1. Variable CSS unique `--gameb-mascot-size`.
  2. Une seule source de vérité breakpoints.
  3. Règle explicite de `z-index` couche décorative vs interactif.
- Limiter question: `max-width`, `line-height >=1.3`, `font-size` adaptatif conservateur.
- Basculer choices en colonne plus tôt sur tablettes compactes.

---

## D) Accessibilité (WCAG)

### Observé
- Présence de `aria-live` pour indice/feedback = bon point.
- Focus visible défini sur plusieurs boutons.
- Contrastes semblent travaillés via mode high contrast.

### Écarts
- `aria-live="assertive"` sur feedback peut être intrusif; préférer `polite` selon contexte.
- Absence d’indication claire de progression vocale pour lecteurs d’écran.
- Potentiel bruit cognitif: animations + auto-next + audio.

### Recommandé
- Basculer feedback standard en `polite`, réserver `assertive` aux erreurs bloquantes.
- Ajouter `aria-describedby` entre question et zone réponses.
- Ajouter option “réduire animations” (respect `prefers-reduced-motion`).

---

## E) Performance front-end

### Observé
- SCSS riche, blur/backdrop-filter, ombres multiples, animations et grands assets images/audio.
- `::ng-deep` utilisé (technique fragile long terme).

### Risques
- Coût rendu sur devices modestes (GPU/CPU), surtout en plein écran + médias.
- Layout shifts possibles selon chargement image + dimension tardive.

### Recommandé
- Réduire usage `backdrop-filter` sur petits écrans/profils low-end.
- Fixer des dimensions média/ratio placeholders pour limiter CLS.
- Remplacer progressivement `::ng-deep` via API de style explicite (classes host/context).

---

## F) Qualité code / architecture

### Observé
- Jeu B page concentre beaucoup de responsabilités (session, audio, hints, timers, UI state, navigation).
- Présence de style inline dans template (spinner loading).

### Risques
- Dette technique: maintenance difficile, régressions probables.
- Testabilité limitée (timers et side effects dans composant).

### Recommandé
- Extraire un orchestrateur `GameBFlowService` (timers + transitions).
- Déplacer styles inline vers SCSS composant.
- Introduire tests unitaires ciblés sur state machine (pause/hint/skip/next).

---

## G) Maintenabilité / scalabilité

### Observé
- Tokens présents mais application hétérogène (valeurs fixes encore nombreuses).
- Règles responsive parfois dupliquées.

### Recommandé
- Définir contrat design system par composant jeu (typographie, espacements, couches z-index).
- Créer utilitaires SCSS partagés: `game-shell`, `question-block`, `choices-grid`.

---

## H) Plan d’exécution priorisé

## Tableau Findings

| ID | Zone | Gravité | Impact | Probabilité | Observé/Inféré | Preuve code | Solution proposée |
|---|---|---|---|---|---|---|---|
| F-01 | Jeu B UI Mascotte | Majeur | Collision visuelle, inconfort lecture | Élevée | Observé | `mascot-decorator.component.scss` + `game-b-page.component.scss` | Unifier sizing mascotte par variable + supprimer contraintes contradictoires |
| F-02 | Jeu B Flow | Majeur | Perte de contrôle perçue | Élevée | Observé | timers auto-next dans composant TS | Auto-next configurable + compte à rebours |
| F-03 | Jeu B A11y | Modéré | Annonces vocales trop abruptes | Moyenne | Observé | `aria-live assertive` feedback | Passer en `polite` hors erreurs critiques |
| F-04 | Jeu B Perf | Modéré | Latence rendu appareils modestes | Moyenne | Inféré | blur/ombres/animations multiples | Profil “low-motion/low-effects” |
| F-05 | Jeu B Architecture | Majeur | Maintenance fragile | Élevée | Observé | composant monolithique | Extraire service d’orchestration d’état |
| F-06 | Jeu A Robustesse config | Modéré | Incohérences difficulté | Moyenne | Inféré | dépendance forte à profile inputs | Sanitize central des paramètres |
| F-07 | Jeu A Distracteurs | Modéré | Qualité question variable | Moyenne | Observé | logique sélection distracteurs | Règles métier de diversité/distance sémantique |
| F-08 | Inter-jeux UX | Majeur | Expérience incohérente A vs B | Élevée | Observé | patterns UI divergents | Créer primitives UI partagées jeux |
| F-09 | SCSS Gouvernance | Modéré | Régressions responsive | Moyenne | Observé | breakpoints dispersés | centraliser breakpoints et conventions |
| F-10 | Build santé projet | Majeur | Qualité release bloquée | Élevée | Observé | dépendance manquante `lucide-angular` | corriger dépendances CI et lockfile |

## Top 10 quick wins (faible risque)
1. Rendre auto-next optionnel par profil.
2. Ajouter countdown visuel avant next auto.
3. Uniformiser `aria-live` en `polite` (sauf blocage).
4. Déplacer styles inline template -> SCSS.
5. Centraliser breakpoints jeux dans tokens.
6. Réduire blur/backdrop sur mobile.
7. Fixer max-width et line-height question seniors.
8. Basculer grid réponses en colonne plus tôt (<900px).
9. Ajouter tests unitaires pause/hint/skip timers.
10. Corriger dépendance `lucide-angular` + check CI build.

## Roadmap 30/60/90 jours

### 30 jours
- Stabiliser dépendances build/CI.
- Quick wins UI Jeu B (mascotte/question/choices/coundown).
- Ajustements A11y prioritaires (`aria-live`, focus, reduced-motion).

### 60 jours
- Extraire `GameBFlowService` + tests unitaires state transitions.
- Harmoniser patterns UI Jeu A/B via composants partagés.
- Introduire sanitize config profil et règles de garde-fous.

### 90 jours
- Optimisation performance ciblée (CLS, rendu, assets).
- Audit UX terrain aidants/patients (sessions observées).
- Dashboard KPI qualité produit (erreurs, abandon, temps réponse).

## Checklist non-régression manuelle pré-release
- [ ] Démarrage jeu A/B sans erreur console.
- [ ] Navigation clavier complète (tab/enter/space) sur actions clés.
- [ ] Pause/reprise n’entraîne pas double timer.
- [ ] Hint ne casse pas lecture TTS ni focus.
- [ ] Skip/next n’envoie pas état incohérent en fin de session.
- [ ] Mascotte n’intersecte pas question/choices sur: 1366x768, 1024x768, 820x1180, 390x844.
- [ ] Taille texte élevée (accessibilité) conserve lisibilité blocs.
- [ ] Mode contraste élevé conserve hiérarchie visuelle.
- [ ] Audio controls utilisables sans souris.
- [ ] Fin de session + redirection statistiques cohérentes.

## Indicateurs qualité recommandés
- **UX**: taux d’abandon par question, temps moyen par réponse, taux d’usage hint/skip.
- **Accessibilité**: taux de parcours clavier complet, incidents focus perdus.
- **Performance**: temps interaction question->feedback, CLS moyen sur écran mobile.
- **Fiabilité**: taux erreurs front, taux sessions interrompues, succès build CI.

---

## Prompt détaillé pour implémenter les axes avec un agent

```text
Tu es un staff engineer Angular + UX engineer senior. Implémente les améliorations suivantes de manière incrémentale, testable et sans régression.

Contexte:
- Repo: projet jeux cognitifs seniors (Jeu A / Jeu B).
- Priorités: cohérence UX, robustesse état jeu, accessibilité, performance UI.

Objectif:
Livrer un lot de refactor + fixes en 4 PRs séparées (petites, relisibles).

PR1 — UI stabilité Jeu B (mascotte/question/choices)
- Unifier sizing mascotte avec variable CSS unique (`--gameb-mascot-size`) et breakpoints centralisés.
- Supprimer contraintes CSS contradictoires entre composant enfant mascotte et page parent.
- Garantir non-collision mascotte avec question/hint/choices sur viewports cibles.
- Ajouter tests visuels minimaux (si stack le permet) ou checklist screenshot documentée.

PR2 — Flow & timers Jeu B
- Extraire logique timers (hint/auto-reveal/auto-next/pause) dans `GameBFlowService`.
- Rendre auto-next configurable (`manual`, `5s`, `8s`) via profil.
- Ajouter countdown visible avant next auto.
- Ajouter tests unitaires: pause/reprise, skip, hint, next, fin de session.

PR3 — Accessibilité transversale A/B
- Standardiser `aria-live` (`polite` par défaut, `assertive` seulement blocant).
- Ajouter support `prefers-reduced-motion`.
- Vérifier focus visible et ordre tab logique.
- Ajouter attributs d’association sémantique question/réponses (`aria-describedby`, regions).

PR4 — Robustesse métier Jeu A + qualité build
- Introduire `sanitizeProfileGameConfig()` pour borner `questionCount`, `answerCount`, délais.
- Stabiliser sélection distracteurs (diversité minimale, non-duplication).
- Corriger dépendances build manquantes (`lucide-angular`) et valider CI.

Contraintes d’implémentation:
- Ne pas casser API existantes des composants publics.
- Préférer petits commits atomiques, messages explicites.
- Ajouter tests pour chaque correction de bug logique.
- Pour chaque PR: inclure “Avant / Après”, risque, plan rollback.

Definition of Done:
- Build front passe.
- Tests unitaires critiques passent.
- Checklist non-régression A/B validée.
- Aucune collision UI observée sur 1366x768, 1024x768, 820x1180, 390x844.
```
