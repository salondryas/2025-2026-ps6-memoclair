# Simulation de 20 Retours d'Experts Techniques sur MemoClair

Panel simulé: UI/UX designers seniors, product designers accessibilité, frontend engineers, fullstack engineers, web architects et leads techniques.

---

## Profil 01 — Camille, Senior Product Designer, 10 ans, healthtech

**Feedback global**  
Le produit a une vraie direction humaine, mais la maquette raconte encore plusieurs produits à la fois. On voit un outil relationnel, un outil de stimulation et un outil de suivi, sans qu'un axe domine complètement. En UX, le principal défaut n'est pas visuel: c'est la cohérence du système. Le profil, les médias, les jeux et les statistiques n'utilisent pas encore la même philosophie ni la même structure de données implicite.

**Défauts notoires repérés**
- Incohérence de posture entre les écrans.
- Parcours aidant non assez orienté tâche.
- Trop de signaux de performance par rapport à la promesse produit.

**Défauts secondaires / détails**
- Microcopy encore inégale.
- Certains écrans n'utilisent pas le patient actif de façon cohérente.
- Les transitions de page perdent du contexte.

**5 questions clés**
- Quelle est la promesse principale, unique, que l'interface doit faire comprendre ?
- Quel est le parcours minimal côté aidant ?
- Quelle donnée utilisateur est la plus importante à faire circuler entre pages ?
- Quelle hiérarchie d'information voulez-vous dans les statistiques ?
- Quel écran trahit le plus aujourd'hui l'intention produit ?

**10 questions piégeuses**
- Pourquoi le profil paramètre-t-il des mécaniques plutôt qu'une intention de séance ?
- En quoi la vue stats ne casse-t-elle pas la promesse relationnelle ?
- Le duo est-il vraiment une expérience différente du solo ?
- Quelle page aide vraiment Isabelle en moins de 30 secondes ?
- Quels éléments de la maquette ne sont là que pour "faire complet" ?
- Pourquoi le jeu B est-il encore construit comme un test ?
- La donnée patient est-elle centralisée ou réinventée page par page ?
- Les contenus personnels ont-ils une vraie structure produit ?
- Le produit sait-il ce qu'est une bonne sortie de séance ?
- Si vous deviez supprimer une page, laquelle enlèverait le moins de valeur ?

---

## Profil 02 — Hugo, UX Designer senior, 8 ans, applications de soin

**Feedback global**  
La maquette est globalement claire, mais elle repose encore beaucoup sur des conventions de formulaire et de quiz. Or ici, l'enjeu UX est précisément d'effacer cette sensation d'évaluation. Ce qui manque le plus, c'est un langage d'interface cohérent: chaque page semble avoir été pensée localement, pas comme partie d'un même système.

**Défauts notoires repérés**
- Les microcopies ne sont pas harmonisées.
- Les retours système ne suivent pas une même tonalité.
- La progression utilisateur n'est pas pensée de bout en bout.

**Défauts secondaires / détails**
- Les CTA pourraient mieux refléter le bénéfice attendu.
- Le duo manque de guidage explicite.
- Le profil ne montre pas clairement ce qu'il influence.

**5 questions clés**
- Quel ton unique voulez-vous donner à l'ensemble du produit ?
- Quelles actions doivent être irréversibles, lesquelles doivent rester très souples ?
- Comment l'utilisateur comprend-il ce qu'a changé son paramétrage ?
- Comment le mode duo doit-il être compris en 5 secondes ?
- Quels écrans doivent être scannables en moins de 10 secondes ?

**10 questions piégeuses**
- Pourquoi vos boutons d'action n'expriment-ils pas toujours le même type de promesse ?
- L'utilisateur comprend-il où il est dans le parcours ?
- Quelle page explique vraiment l'usage des thèmes porteurs ?
- Pourquoi le jeu B ne reprend-il pas visiblement les médias sélectionnés ?
- Le joueur comprend-il ce qu'il peut faire quand il ne sait pas ?
- Pourquoi l'aide arrive-t-elle comme une correction plutôt qu'un accompagnement ?
- Que veut dire "enregistrer le profil" si aucune conséquence visible n'apparaît ?
- Les stats sont-elles faites pour être lues ou juste démontrées ?
- Les patients proposés sont-ils les mêmes partout ?
- Le parcours raconte-t-il la même chose en solo, duo et espace aidant ?

---

## Profil 03 — Léa, UI Designer accessibilité, 12 ans, secteur public

**Feedback global**  
L'interface a de bonnes bases de lisibilité, mais l'accessibilité reste plus déclarative que systémique. On voit des réglages de police et de contraste, mais pas encore une vraie architecture de composants pensée pour les troubles visuels, moteurs et attentionnels. Il faut intégrer ces besoins dans la structure des écrans, pas seulement dans un panneau de réglage.

**Défauts notoires repérés**
- Accessibilité pensée comme paramètre, pas comme fondation.
- Incohérences dans la taille et la nature des cibles interactives.
- Certaines pages utilisent des comportements dynamiques sans indices suffisants.

**Défauts secondaires / détails**
- Quelques libellés d'ARIA pourraient être plus précis.
- Les retours visuels de sélection ne sont pas homogènes.
- Le contraste pourrait être mieux réparti dans certaines cartes.

**5 questions clés**
- Quelles hypothèses d'accessibilité sont structurelles, pas optionnelles ?
- Comment garantissez-vous de grandes cibles partout ?
- Comment rendez-vous la hiérarchie visuelle prévisible ?
- Quels éléments doivent rester stables d'un jeu à l'autre ?
- Comment exposez-vous l'aide sans surcharge ?

**10 questions piégeuses**
- Pourquoi certaines pages dépendent-elles encore d'animations ou d'apparitions tardives ?
- Les feedbacks sont-ils lisibles sans couleur seule ?
- Les boutons sont-ils utilisables avec tremblements et doubles appuis ?
- Pourquoi le corps de certaines pages utilise-t-il des règles flex incomplètes ?
- Le focus clavier est-il cohérent partout ?
- Les contenus ajoutés dynamiquement annoncent-ils correctement leur état ?
- Le contraste élevé modifie-t-il toute la chaîne ou juste quelques écrans ?
- Vos timings d'aide sont-ils compatibles avec une attention fluctuante ?
- L'écran de fin évite-t-il vraiment la surcharge ?
- Le duo garde-t-il une séparation visuelle claire entre les rôles ?

---

## Profil 04 — Maxime, frontend engineer, 7 ans, SPA et design systems

**Feedback global**  
Le principal problème n'est pas la maquette native en soi, c'est la dispersion de la logique. Chaque page gère son état local avec ses propres conventions. Le patient actif est stocké parfois dans `localStorage`, parfois dans `sessionStorage`, parfois avec des jeux de noms différents. À moyen terme, ça devient ingérable. Même pour une maquette, il faut une convention minimale.

**Défauts notoires repérés**
- Source de vérité du patient non unifiée.
- Logique de page très dupliquée et peu factorisée.
- État implicite plutôt qu'explicite.

**Défauts secondaires / détails**
- Nommage hétérogène des clés de stockage.
- Certains comportements sont branchés en `onclick` inline.
- Les événements de synchronisation inter-pages sont incomplets.

**5 questions clés**
- Quelle clé représente officiellement le patient actif ?
- Quelles données doivent être en `sessionStorage` et lesquelles en `localStorage` ?
- Quel contrat de données commun existe entre aidant, stats et jeux ?
- Quelles pages doivent réagir au changement de patient ?
- Quels fichiers devraient devenir vos points d'orchestration minimaux ?

**10 questions piégeuses**
- Pourquoi `activePatient` et `selectedPatient` coexistent-ils sans contrat clair ?
- Pourquoi certains patients sont-ils Jean/Marie/Pierre et d'autres Marcel/Jean/Paul ?
- Que se passe-t-il quand on change de patient dans la navbar puis qu'on ouvre un jeu ?
- Pourquoi plusieurs pages redéduisent-elles elles-mêmes le nom du patient ?
- Les pages stats et jeux lisent-elles vraiment la même réalité ?
- Que se passe-t-il quand un patient est choisi côté jeux mais pas côté aidant ?
- Un retour arrière casse-t-il le contexte courant ?
- Quel écran initialise l'état et lequel le consomme ?
- Comment testez-vous un bug de synchronisation aujourd'hui ?
- Si vous ajoutez un 4e patient, combien de fichiers faut-il toucher ?

---

## Profil 05 — Sarah, fullstack engineer, 11 ans, applications métiers

**Feedback global**  
Pour une maquette, la dette technique principale vient des données non structurées. Les médias sont stockés comme une simple liste de fichiers nommés, les profils comme des réglages peu reliés au jeu, et les statistiques comme des scores codés en dur. Il manque un modèle métier minimal, même purement côté front.

**Défauts notoires repérés**
- Pas de modèle de données cohérent pour médias, profil et sessions.
- Jeux trop alimentés par du hardcode local.
- Aucune vraie relation entre configuration et expérience générée.

**Défauts secondaires / détails**
- Les structures d'objet changent selon les fichiers.
- Les noms de propriétés ne sont pas toujours cohérents.
- Les fallbacks sont parfois implicites, pas explicités dans la data.

**5 questions clés**
- Quel est le schéma minimal d'un profil patient ?
- Quel est le schéma minimal d'un média personnel exploitable ?
- Quel est le schéma minimal d'une session de jeu ?
- Quels champs sont réellement consommés par chaque écran ?
- Comment rendre les jeux pilotés par la donnée plus que par le code de la page ?

**10 questions piégeuses**
- Pourquoi un média personnel n'a-t-il ni thème, ni période, ni contexte ?
- Comment le jeu B peut-il utiliser plus qu'un simple nom de fichier ?
- Pourquoi les stats codent-elles des erreurs et non des repères d'observation ?
- Le profil est-il lu par les jeux ou juste stocké ?
- Qu'est-ce qui lie une session à un patient aujourd'hui ?
- Comment réutiliser une même session de données dans plusieurs vues ?
- Si vous voulez un export plus tard, sur quelle structure partez-vous ?
- Pourquoi la maquette encode-t-elle la logique dans le DOM plutôt que dans la donnée ?
- Quel objet unique représente une "séance" MemoClair ?
- Le duo a-t-il un modèle différent du solo ou juste un HTML différent ?

---

## Profil 06 — Antoine, web architect, 14 ans, applications complexes

**Feedback global**  
Votre maquette a besoin d'un petit contrat d'architecture, même en natif. Aujourd'hui, on voit des composants custom, du JS de page, du stockage local, des données simulées et des conventions de nommage qui se contredisent. C'est encore tenable parce que le périmètre est petit. Ça ne le sera plus après quelques itérations.

**Défauts notoires repérés**
- Absence de contrat d'architecture front minimal.
- Couplage fort entre HTML spécifique et logique métier.
- Hétérogénéité des conventions de nommage.

**Défauts secondaires / détails**
- Certains chemins d'assets sont incohérents.
- La séparation entre données, logique et rendu est floue.
- Le réemploi est faible entre pages proches.

**5 questions clés**
- Quelle convention commune imposez-vous sur les données et le stockage ?
- Quels éléments doivent devenir des utilitaires partagés ?
- Quels écrans ont besoin d'une orchestration commune ?
- Quelles conventions de nommage et de chemin faut-il figer ?
- Quels comportements doivent être mutualisés dès maintenant ?

**10 questions piégeuses**
- Pourquoi `pictures` et `pictuers` coexistent-ils dans les chemins d'assets ?
- Comment savez-vous qu'un chemin d'image est valide aujourd'hui ?
- Pourquoi la maquette s'appuie-t-elle encore sur des `onclick` inline ?
- Quel morceau de logique voudriez-vous tester unitairement demain ?
- Comment évitez-vous les divergences entre composants et pages statiques ?
- Votre navbar expose-t-elle un contrat ou juste une implémentation opportuniste ?
- Que se passe-t-il si le stockage local contient une donnée invalide ?
- Où est la frontière entre donnée de démonstration et donnée utilisateur ?
- Qu'est-ce qui empêche des regressions silencieuses entre les pages ?
- Le système reste-t-il maintenable si vous ajoutez deux nouveaux jeux ?

---

## Profil 07 — Emma, product designer, 9 ans, edtech/accessibilité

**Feedback global**  
Je vois une bonne direction de ton et une bonne base de charte, mais l'information n'est pas encore suffisamment hiérarchisée selon les tâches réelles. Le produit gagnerait en clarté si chaque page répondait à une seule question principale. Aujourd'hui certaines pages veulent informer, configurer, rassurer et documenter à la fois.

**Défauts notoires repérés**
- Hiérarchie d'information trop large sur certaines pages.
- Trop de rôles mélangés dans un même écran.
- Manque de lisibilité de l'action principale.

**Défauts secondaires / détails**
- Les sous-textes sont parfois trop longs.
- Les états vides ne portent pas encore assez le produit.
- Les écrans d'après-action pourraient être plus explicites.

**5 questions clés**
- Quelle est l'action principale de chaque page ?
- Quelle info doit être vue en premier, en second, en dernier ?
- Qu'est-ce qui doit être optionnel visuellement ?
- Quel message d'état vide apporte le plus de valeur ?
- Qu'est-ce qui devrait disparaître sur mobile ou petits écrans ?

**10 questions piégeuses**
- Pourquoi la page profil mélange-t-elle accessibilité, difficulté et réglages de jeu ?
- Pourquoi la page média ne montre-t-elle pas un usage attendu concret ?
- Les stats répondent-elles à une tâche claire ?
- Le duo explique-t-il son principe en un seul regard ?
- Quel est le CTA principal de la page famille ?
- Pourquoi plusieurs écrans n'ont-ils pas d'état "première utilisation" fort ?
- Qu'est-ce qui rassure l'utilisateur quand aucun média n'est chargé ?
- Les titres de pages disent-ils vraiment ce qu'on va y faire ?
- L'espace jeux différencie-t-il assez les deux modes ?
- Que voit un utilisateur qui ne lit pas les paragraphes de support ?

---

## Profil 08 — Noé, frontend engineer, 6 ans, vanilla JS

**Feedback global**  
Le projet peut parfaitement rester en maquette native, mais il faut lui appliquer quelques règles de base: pas de logique critique en attribut HTML, pas de données codées dans plusieurs endroits, et pas de rendu dépendant d'états implicites. Ici, ce sont surtout des problèmes de discipline plus que de stack.

**Défauts notoires repérés**
- Usage d'`onclick` inline.
- État patient codé dans plusieurs couches.
- Rendu souvent généré sans garde-fou.

**Défauts secondaires / détails**
- Quelques `innerHTML` pourraient être mieux maîtrisés.
- Les événements ne sont pas toujours centralisés.
- Les pages n'annoncent pas clairement leurs dépendances.

**5 questions clés**
- Quels handlers faut-il sortir en priorité du HTML ?
- Quels points d'entrée JS doivent être stabilisés ?
- Quels garde-fous faut-il mettre autour du rendu dynamique ?
- Comment fiabiliser la synchronisation entre pages ?
- Quelles données doivent être validées avant affichage ?

**10 questions piégeuses**
- Pourquoi choisir un patient via `onclick` inline ?
- Que se passe-t-il si l'élément attendu n'existe plus dans le DOM ?
- Un JSON cassé dans le `localStorage` fait-il planter la page ?
- Combien de fichiers écoutent `patientChanged` aujourd'hui ?
- Pourquoi les jeux ne partagent-ils pas de helpers communs ?
- La maquette tolère-t-elle un stockage partiellement vide ?
- Quel est le comportement de repli de chaque page ?
- Un test manuel permet-il de couvrir tous les cas de patient ?
- Comment évitez-vous les effets de bord entre plusieurs `DOMContentLoaded` ?
- La page profil a-t-elle un cycle de vie clair ?

---

## Profil 09 — Inès, UX researcher, 7 ans, santé numérique

**Feedback global**  
Techniquement, votre problème UX principal est la lisibilité du modèle mental. L'utilisateur ne sait pas toujours ce qui est paramétré, ce qui est déjà enregistré, ce qui est réutilisé par les jeux, et ce qui n'est qu'une démo figée. La maquette doit mieux montrer les relations entre ses écrans.

**Défauts notoires repérés**
- Le lien entre profil, médias, jeux et stats n'est pas assez visible.
- Les conséquences des actions utilisateur sont peu explicites.
- Le système d'état enregistré manque de feedback persistant.

**Défauts secondaires / détails**
- Les confirmations sont trop faibles ou trop temporaires.
- Certains textes n'expliquent pas la finalité de l'action.
- Les pages semblent parfois indépendantes les unes des autres.

**5 questions clés**
- Comment l'utilisateur comprend-il qu'il a bien préparé une séance ?
- Comment voyez-vous la relation entre un thème, un média et un jeu ?
- Quelle confirmation doit rester visible après sauvegarde ?
- Que doit comprendre un proche après 2 minutes de navigation ?
- Quelle relation explicite créez-vous entre une séance et son résumé ?

**10 questions piégeuses**
- Pourquoi la page profil ne montre-t-elle pas directement ce qu'elle va influencer ?
- Pourquoi la page médias ne réutilise-t-elle pas visiblement les thèmes choisis ?
- Les jeux montrent-ils qu'ils utilisent les contenus importés ?
- Les stats savent-elles dire à quoi elles servent ?
- La sauvegarde du profil laisse-t-elle une trace claire ?
- Peut-on savoir quel patient est vraiment actif sans regarder la navbar ?
- Le système distingue-t-il configuration et observation ?
- Qu'est-ce qui donne confiance dans le fait que l'outil "retient" quelque chose ?
- Que signifie une galerie de médias non vide si le jeu B ne les exploite pas clairement ?
- Le parcours rend-il le travail préparatoire gratifiant et compréhensible ?

---

## Profil 10 — Julien, lead frontend, 15 ans, SaaS

**Feedback global**  
La maquette est suffisamment petite pour qu'un refactor ciblé ait un gros effet de levier. Il ne faut pas sur-ingénierer, mais il faut stabiliser les conventions. En ce moment, plusieurs problèmes de fond viennent de choix "provisoires" qui commencent déjà à faire système.

**Défauts notoires repérés**
- Prototypes locaux devenus quasi-architecture.
- Duplication de données et de comportements.
- Difficulté à raisonner sur les effets d'un changement.

**Défauts secondaires / détails**
- Manque de helpers partagés.
- Nommage parfois irrégulier.
- Quelques comportements visuels codés à la main dans le JS.

**5 questions clés**
- Quelles conventions minimales faut-il imposer maintenant ?
- Quels blocs de données doivent être normalisés ?
- Quels comportements doivent être centralisés ?
- Quelles pages présentent le plus de risque de divergence ?
- Quel refactor offre le meilleur ROI immédiat ?

**10 questions piégeuses**
- Pourquoi la donnée patient n'est-elle pas encapsulée dans un utilitaire ?
- Pourquoi la page stats possède-t-elle sa propre vérité patient ?
- Le duo et le solo pourraient-ils partager une partie de leur structure ?
- Pourquoi les libellés ne viennent-ils pas de données dans certains cas ?
- Quel comportement se casse en premier si on renomme un patient ?
- Les valeurs par défaut sont-elles définies au même endroit ?
- Comment fiabilisez-vous une navigation non linéaire ?
- Vos pages sont-elles conçues pour être rechargées indépendamment ?
- Les helpers temps/session sont-ils partagés ?
- Pourquoi plusieurs pages manipulent-elles le DOM de façon très impérative ?

---

## Profil 11 — Clara, senior accessibility specialist, 13 ans

**Feedback global**  
Il y a du potentiel, mais plusieurs choix techniques restent fragiles du point de vue accessibilité: feedbacks parfois reposant trop sur la couleur, structure de pages injectée dynamiquement sans toujours d'annonce claire, et parcours de décision encore exigeants cognitivement. L'enjeu n'est pas de rajouter plus d'ARIA partout, mais de simplifier le comportement même de l'interface.

**Défauts notoires repérés**
- Accessibilité comportementale insuffisamment pensée.
- Feedbacks trop dépendants de codes visuels.
- Parcours cognitivement denses pour le rôle aidant.

**Défauts secondaires / détails**
- Certains états dynamiques pourraient mieux utiliser `aria-live`.
- Les titres et landmarks pourraient être plus cohérents.
- Les champs/contrôles ne sont pas toujours regroupés de façon sémantique.

**5 questions clés**
- Quels contenus doivent être annoncés immédiatement aux technologies d'assistance ?
- Comment simplifiez-vous l'effort cognitif sur les pages aidant ?
- Comment rendez-vous les changements d'état perceptibles sans couleur seule ?
- Quels éléments doivent rester fixes visuellement et sémantiquement ?
- Comment garantissez-vous une navigation cohérente de page à page ?

**10 questions piégeuses**
- Pourquoi un changement majeur d'état n'est-il pas toujours annoncé ?
- Les feedbacks patient sont-ils compréhensibles sans emoji ?
- Le contraste élevé est-il vraiment testé sur les écrans critiques ?
- Le duo garde-t-il une structure lisible avec lecteur d'écran ?
- Les boutons ont-ils toujours un rôle clair et stable ?
- Une non-réponse peut-elle être représentée sans confusion ?
- Pourquoi certains écrans s'appuient-ils autant sur des sous-textes ?
- Le profil est-il compréhensible à l'écoute sans contexte visuel ?
- Les galeries dynamiques restent-elles navigables proprement ?
- Les timers implicites respectent-ils tous les profils d'usage ?

---

## Profil 12 — Yassine, fullstack engineer, 9 ans, produits de données

**Feedback global**  
Je vois une tension classique: vous avez déjà besoin d'un modèle d'observation, mais la maquette s'appuie encore sur un modèle de score. Si vous continuez avec le mauvais modèle, chaque nouvel écran coûtera plus cher à corriger. Il faut réaligner la structure de données des stats avec la philosophie produit.

**Défauts notoires repérés**
- Modèle de statistiques mal orienté.
- Données d'observation et données de performance confondues.
- Jeu et suivi pas encore branchés sur le même vocabulaire métier.

**Défauts secondaires / détails**
- Les catégories de stats sont trop proches de la logique d'erreur.
- Le lien entre jeu joué et observation utile n'est pas explicite.
- La représentation pourrait être plus sémantique et moins scolaire.

**5 questions clés**
- Quel est votre modèle cible pour une session observée ?
- Quelles métriques servent réellement à l'adaptation ?
- Quelles métriques servent réellement à l'aidant ?
- Quelles données n'ont pas besoin d'exister du tout ?
- Comment faire converger stats et parcours de jeu ?

**10 questions piégeuses**
- Pourquoi stocker des erreurs si vous voulez des repères de séance ?
- Les catégories "faces / objets / souvenirs" sont-elles encore pertinentes ?
- Comment le duo remonte-t-il des infos différentes du solo ?
- Que faites-vous d'une séance abandonnée très tôt ?
- Qu'est-ce qu'un signal d'aide dans votre modèle ?
- Quelle donnée relie un profil patient à une recommandation de prochaine séance ?
- Les stats savent-elles représenter l'absence de réponse autrement que comme un manque ?
- Que se passe-t-il si vous ajoutez un 3e jeu ?
- La structure actuelle vous permet-elle un vrai historique plus tard ?
- Pourquoi la session n'est-elle pas le centre de votre modélisation ?

---

## Profil 13 — Marion, design lead, 16 ans, produits grand public

**Feedback global**  
La charte est plutôt stable, mais la dette d'expérience vient de la narration produit. La maquette doit expliquer plus clairement ce que chaque espace apporte. Aujourd'hui, beaucoup de valeur est supposée, pas montrée. Les pages aidant sont aussi parfois plus "administratives" que rassurantes.

**Défauts notoires repérés**
- Narration produit incomplète.
- Espace aidant pas assez orienté bénéfice immédiat.
- Jeu B pas assez démonstratif du concept de réminiscence assistée.

**Défauts secondaires / détails**
- Quelques titres peuvent être plus parlants.
- Les bénéfices d'après-action devraient être plus visibles.
- Certains écrans ne capitalisent pas assez sur la marque MemoClair.

**5 questions clés**
- Que doit comprendre un utilisateur au premier regard sur chaque espace ?
- Quel bénéfice immédiat affiche la page profil ?
- Quel bénéfice immédiat affiche la page médias ?
- Comment le mode duo manifeste-t-il sa différence ?
- Comment montrez-vous le lien entre préparation et usage réel ?

**10 questions piégeuses**
- Pourquoi l'espace jeux ne raconte-t-il pas mieux la nature différente des jeux ?
- Pourquoi la page profil ressemble-t-elle plus à un setup technique qu'à une aide ?
- Pourquoi la page médias parle-t-elle peu de conversation future ?
- Qu'est-ce qui donne envie d'ouvrir les stats aujourd'hui ?
- Pourquoi le mode duo n'affiche-t-il pas des conseils clairement "aidant" ?
- Le produit capitalise-t-il assez sur l'absence de jugement ?
- Quel écran incarne le mieux la promesse de MemoClair ?
- Quel écran l'incarne le moins ?
- La maquette montre-t-elle assez ce que signifie "pas un quiz" ?
- Si quelqu'un ne lit qu'une page, laquelle doit tout raconter ?

---

## Profil 14 — Bastien, ingénieur logiciel, 12 ans, qualité logicielle

**Feedback global**  
La maquette fonctionne comme un ensemble de pages scriptées, mais elle manque de garde-fous. Vous êtes dans la zone où un petit effort de robustesse peut éviter beaucoup de bugs silencieux: valider les données du stockage, centraliser quelques utilitaires, arrêter de coder des chemins ou des labels dans trop d'endroits.

**Défauts notoires repérés**
- Faible robustesse face à des données inattendues.
- Multiplication des constantes locales non partagées.
- Peu de stratégie de repli explicite.

**Défauts secondaires / détails**
- Gestion d'erreur minimaliste.
- Manque d'utilitaires pour le patient courant et la session.
- Quelques hypothèses DOM non sécurisées.

**5 questions clés**
- Quels cas d'erreur faut-il couvrir avant tout ?
- Quelles données issues du stockage doivent être sécurisées ?
- Quels utilitaires partagés créer ou consolider implicitement ?
- Quels chemins d'assets et identifiants faut-il normaliser ?
- Quels écrans doivent être capables de s'ouvrir seuls sans contexte préalable ?

**10 questions piégeuses**
- Que se passe-t-il si `selectedPatient` vaut une valeur inattendue ?
- Et si `media_<patient>` contient un JSON invalide ?
- Pourquoi l'application dépend-elle d'un ordre de navigation implicite ?
- Quels écrans échouent proprement sans données ?
- Pourquoi la maquette n'a-t-elle pas de couche de données commune minimale ?
- Comment repérez-vous un asset cassé aujourd'hui ?
- Une faute de frappe de chemin est-elle visible avant la démo ?
- Pourquoi certaines pages supposent-elles que le patient actif existe déjà ?
- Avez-vous un fallback pour chaque écran critique ?
- Le système tolère-t-il un `localStorage` vide ?

---

## Profil 15 — Alice, frontend architect, 18 ans, design systems et accessibilité

**Feedback global**  
La cohérence visuelle est acceptable, mais la cohérence d'interaction reste faible. Les mêmes gestes utilisateurs n'ont pas toujours les mêmes conséquences, les mêmes types de pages n'emploient pas la même structure, et les composants réutilisés n'imposent pas encore de contrat d'usage assez fort.

**Défauts notoires repérés**
- Système d'interaction insuffisamment normalisé.
- Réemploi de composants sans conventions suffisantes.
- Différences de structure entre pages proches.

**Défauts secondaires / détails**
- Des états sélectionnés varient d'une page à l'autre.
- Les feedbacks d'enregistrement sont hétérogènes.
- Les pages de jeu pourraient partager plus de patterns.

**5 questions clés**
- Quels patterns d'interaction doivent être standardisés ?
- Quelles pages devraient partager plus de structure ?
- Comment un composant custom impose-t-il ses dépendances ?
- Quels états UI doivent être identiques partout ?
- Que faut-il standardiser côté microcopy d'action ?

**10 questions piégeuses**
- Pourquoi le duo et le solo n'ont-ils pas des patterns plus proches ?
- Les boutons sélectionnés suivent-ils toujours la même logique ?
- Pourquoi certains écrans injectent-ils des badges et d'autres non ?
- Les messages de confirmation sont-ils uniformes ?
- Pourquoi la navbar et les sélecteurs patient ne partagent-ils pas le même modèle ?
- Quel pattern de carte est réellement canonique dans la maquette ?
- Que se passe-t-il si un composant change de markup ?
- Les pages supportent-elles toutes un même socle responsive ?
- La logique de focus et de retour arrière est-elle uniforme ?
- La maquette a-t-elle un vrai design system ou seulement un style commun ?

---

## Profil 16 — Paul, web performance engineer, 8 ans

**Feedback global**  
La performance n'est pas votre urgence absolue ici, mais la simplicité structurelle oui. Chaque duplication de logique et chaque rendu local non mutualisé coûtent en compréhension, donc en vitesse de correction. Dans une maquette, la première performance c'est la maintenabilité.

**Défauts notoires repérés**
- Surcoût cognitif de maintenance.
- Trop de logique répétée pour un périmètre réduit.
- Données demo insuffisamment mutualisées.

**Défauts secondaires / détails**
- Plusieurs pages recalculent des choses triviales.
- Les états par défaut sont éclatés.
- Les transitions pourraient mieux réutiliser des helpers communs.

**5 questions clés**
- Quelles duplications coûtent le plus cher aujourd'hui ?
- Quels jeux partagent déjà une logique commune non extraite ?
- Quelles données demo devraient être centralisées ?
- Où se trouvent les plus gros coûts de changement ?
- Quel refactor améliore le plus la lisibilité ?

**10 questions piégeuses**
- Pourquoi chaque page reconstruit-elle son propre petit monde ?
- Combien de valeurs par défaut du patient existent ?
- Quelle part du jeu B est réutilisable avec le duo ?
- Pourquoi les labels de patients sont-ils codés dans plusieurs fichiers ?
- Si vous changez la logique du patient actif, où faut-il aller ?
- Les stats ont-elles besoin de leur propre sélecteur isolé ?
- Comment évitez-vous les divergences de copy entre pages proches ?
- Le produit tolère-t-il l'ajout d'un nouveau thème sans dispersion ?
- Le profil, les médias et les jeux partagent-ils assez de données ?
- Pourquoi la démonstration vous coûte-t-elle autant en cohérence ?

---

## Profil 17 — Chloé, UX Writer, 11 ans

**Feedback global**  
La technique rejoint ici la microcopy: le système n'est pas encore piloté par un vocabulaire canonique. Vous avez besoin d'un lexique produit fixe. Tant que "score", "réussite", "indice", "guidage", "session", "souvenir", "profil" changent de sens ou d'intention selon les écrans, l'expérience semblera bricolée.

**Défauts notoires repérés**
- Lexique produit non stabilisé.
- Libellés qui contredisent la philosophie du service.
- Absence de canon rédactionnel par type d'écran.

**Défauts secondaires / détails**
- Les titres pourraient être plus orientés usage.
- Les descriptions de jeux pourraient mieux différencier les promesses.
- Les messages de fin et d'aide manquent d'un style guide unique.

**5 questions clés**
- Quels mots interdisez-vous explicitement ?
- Quels mots deviennent votre vocabulaire canonique ?
- Quelle différence de ton entre patient, aidant et professionnel ?
- Comment maintenir l'absence de jugement dans toutes les copies ?
- Quelle microcopy de secours doit exister partout ?

**10 questions piégeuses**
- Pourquoi "taux de réussite" existe-t-il encore ?
- Pourquoi le duo parle-t-il parfois comme un jeu d'accord ?
- Pourquoi la page profil dit-elle "configuration" et pas "préparer la séance" ?
- Le jeu B dit-il vraiment "souvenir" ou encore "réponse" ?
- La fin de séance valorise-t-elle le lien ou le résultat ?
- Les messages d'indice ressemblent-ils encore à une aide scolaire ?
- L'espace famille parle-t-il comme un espace de soin ?
- Quel mot de la maquette vous dessert le plus aujourd'hui ?
- Votre lexique est-il assez stable pour construire le backend plus tard ?
- Que faudrait-il renommer en premier pour clarifier toute la maquette ?

---

## Profil 18 — Victor, fullstack lead, 13 ans

**Feedback global**  
Je regarderais ce projet comme une maquette qui doit déjà préparer sa suite. Il faut donc éviter les impasses de structure. Tout ce qui est aujourd'hui du hardcode opportuniste dans les jeux, les stats et les profils doit être réorganisé autour de quelques objets clairs. Sinon chaque ajout coûtera deux fois plus.

**Défauts notoires repérés**
- Trop de logique spécifique page par page.
- Difficulté à préparer la transition vers une app plus intégrée.
- Données de démonstration non assez structurées.

**Défauts secondaires / détails**
- Les pages sont peu testables mentalement.
- Les contrats entre écrans sont implicites.
- Le trio patient/profil/session n'est pas clair.

**5 questions clés**
- Quel shape de donnée rendrait la suite du projet la plus simple ?
- Quels écrans doivent déjà penser en termes d'état partagé ?
- Quels objets faut-il arrêter de coder en dur ?
- Quelle partie mérite le plus une normalisation immédiate ?
- Quel contrat de session faut-il introduire dès maintenant ?

**10 questions piégeuses**
- Si vous passiez demain sur API, quelles pages casseraient le plus ?
- Quel objet unifierait le mieux profil, médias et jeux ?
- Le duo est-il un cas à part ou une variante du jeu B ?
- Pourquoi les statistiques ne consomment-elles pas un même modèle que les jeux ?
- Comment représenteriez-vous une séance interrompue ?
- Quel serait le schéma JSON d'un souvenir réutilisable ?
- Combien de propriétés d'objet sont aujourd'hui purement décoratives ?
- Pourquoi les pages n'ont-elles pas de fallback data centralisé ?
- La maquette encode-t-elle déjà trop d'hypothèses UI dans la data ?
- Quelle refonte de structure donnerait le meilleur ROI pour la suite ?

---

## Profil 19 — Mélanie, senior service designer, 10 ans, santé

**Feedback global**  
Techniquement, la maquette souffre surtout d'un manque de cohérence service-to-service: l'espace famille, l'espace aidant, les jeux et les stats ne sont pas encore manifestement connectés. Pour un utilisateur, cela se traduit par un doute: "est-ce que ce que je viens de faire sert vraiment à quelque chose ?"

**Défauts notoires repérés**
- Faible perception de continuité entre espaces.
- Actions utilisateur peu valorisées dans la suite du parcours.
- Effets de la préparation insuffisamment visibles.

**Défauts secondaires / détails**
- Les entrées de parcours pourraient être plus explicites.
- Certains retours d'action méritent d'être persistants.
- Les états vides devraient mieux vendre la suite.

**5 questions clés**
- Comment montrez-vous qu'un thème choisi alimente un futur jeu ?
- Comment montrez-vous qu'un média ajouté sera réutilisé ?
- Comment montrez-vous qu'une séance nourrit la suivante ?
- Comment l'utilisateur sait-il qu'il a bien préparé quelque chose d'utile ?
- Quel écran fait le mieux le lien entre tous les autres ?

**10 questions piégeuses**
- Pourquoi les statistiques ne font-elles pas le lien avec les thèmes porteurs ?
- Pourquoi le jeu B n'affiche-t-il pas clairement l'origine du média ?
- Pourquoi le profil n'est-il pas résumé dans l'espace jeux ?
- Le patient actif est-il vraiment partagé partout ?
- Quelle preuve donnez-vous que la préparation sert au jeu suivant ?
- L'espace famille voit-il l'impact de ses ajouts ?
- Les messages d'état vide racontent-ils la suite du parcours ?
- Quel écran fait aujourd'hui office de pont entre les espaces ?
- Le parcours ressemble-t-il à un service continu ou à des pages juxtaposées ?
- Qu'est-ce qui donne confiance dans la continuité produit ?

---

## Profil 20 — Romain, principal engineer, 17 ans, plateformes web

**Feedback global**  
Votre maquette peut gagner énormément sans changer de stack ni de look, juste en clarifiant ses contrats. À ce stade, les meilleurs gains techniques sont des gains de cohérence: un patient actif unique, un profil exploitable, un média structuré, une session observable, des jeux moins codés comme des quiz, et des statistiques branchées sur ces mêmes objets. C'est exactement le type de refactor à très fort ROI avant toute industrialisation.

**Défauts notoires repérés**
- Contrats métier trop faibles.
- Trop d'indices d'un prototype devenu durable.
- Alignement insuffisant entre données, UI et promesse produit.

**Défauts secondaires / détails**
- Quelques fautes de structure dans les chemins et conventions.
- Styles de page encore un peu hétérogènes.
- Trop peu d'utilitaires conceptuels communs.

**5 questions clés**
- Quel est le plus petit socle d'architecture dont vous avez besoin ?
- Quelles conventions doivent être figées immédiatement ?
- Quels objets de données doivent être rendus canon ?
- Quelles incohérences doivent être éliminées avant toute nouvelle feature ?
- Quelle refonte apporte le plus de valeur sans alourdir le projet ?

**10 questions piégeuses**
- Pourquoi le produit n'a-t-il pas encore une seule source de vérité patient ?
- Pourquoi les stats utilisent-elles encore un modèle de score ?
- Pourquoi le jeu B n'est-il pas data-driven autour des souvenirs ?
- Pourquoi le duo n'est-il pas implémenté comme variante d'une même structure ?
- Pourquoi les médias ne sont-ils pas structurés pour être réutilisables ?
- Pourquoi le profil ne produit-il pas un objet clair de posture de séance ?
- Pourquoi certaines pages ne sont-elles pas robustes sans contexte préalable ?
- Pourquoi l'état courant n'est-il pas synchronisé entre tous les espaces ?
- Quel bug fera le plus mal en démo si rien n'est refactoré ?
- Si vous devez défendre la dette technique devant un jury, quel est votre argument principal ?

