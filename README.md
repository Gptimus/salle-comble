# Salle Comble · Monter une infra qui tient la charge

[![CI](https://github.com/Gptimus/salle-comble/actions/workflows/ci.yml/badge.svg)](https://github.com/Gptimus/salle-comble/actions/workflows/ci.yml)

Simulateur 3D interactif (en français) : comment faire évoluer la billetterie d'une salle de concert en 18 étapes, du laptop du développeur jusqu'au multi-région.

**Site : https://gptimus.github.io/salle-comble/**

## Étapes

1. Le site tourne sur le laptop du dev
2. Un serveur dans un datacenter
3. Scaling vertical
4. Séparer application et base de données
5. Scaling horizontal et load balancer
6. Plusieurs load balancers répartis par le DNS
7. Sharding de la base
8. Réplication primaire / réplicas
9. CDN pour les fichiers statiques
10. Cache Redis (cache-aside, cache stampede)
11. Rate limiting contre les bots (token bucket, 429)
12. Queue et workers pour les réservations (retries, DLQ)
13. Notifications email, SMS, push (fan-out, idempotence)
14. Kubernetes : pods, HPA, KEDA, cluster autoscaler, auto-réparation
15. Déploiements : recreate, rolling update, canary avec retour automatique
16. Résilience : timeouts, retries avec backoff, disjoncteur et réponse de secours
17. Multi-région : GeoDNS, bascule Paris vers Montréal, promotion du réplica
18. Observabilité : SLO, budget d'erreurs, alertes sur le burn rate, trace distribuée

## Simulation

- Charge de 10 à 10 millions de fans (échelle logarithmique).
- Moteur de files d'attente : latence médiane et p99, taux d'erreur, historique sur une minute.
- Scénarios : manuel, ouverture des ventes (×30 en 2 s), journée type.
- Pannes : serveur applicatif, load balancer, base lente, expiration du cache, fournisseur SMS, pod ou nœud Kubernetes, service lent, région entière.

Les capacités, latences et prix affichés sont des ordres de grandeur issus d'un modèle simplifié. Les durées (démarrage d'un pod, fenêtres d'alerte) sont raccourcies.

## Développer

La page se modifie dans `src/index.html` (three.js chargé depuis jsDelivr, version figée, avec Subresource Integrity). `npm run build` écrit le site publié à la racine du dépôt : c'est ce dossier que GitHub Pages sert depuis `main`.

```bash
npm ci
npx playwright install chromium   # une fois
npm run build                     # src/ → racine : index.html, og.png, robots.txt, sitemap.xml
npm run check                     # racine à jour, contrôles statiques (--online : télécharge et vérifie les empreintes SRI)
npm test                          # reconstruit le site, puis tests navigateur (Playwright, ordinateur et mobile)
npm run serve                     # http://localhost:4173
```

| Fichier | Rôle |
| --- | --- |
| `src/index.html` | La page source : HTML, CSS, simulation et scène 3D |
| `index.html`, `og.png`, `robots.txt`, `sitemap.xml`, `.nojekyll` | Site publié, généré par `npm run build` (ne pas modifier à la main) |
| `src/og.png` | Image de partage (1200 × 630) |
| `scripts/build.mjs`, `scripts/site.mjs` | Génèrent le site à la racine : page avec empreinte de build, `robots.txt`, `sitemap.xml` |
| `scripts/check.mjs` | Racine à jour par rapport à `src/`, syntaxe du script, versions figées, empreintes SRI comparées à une liste de confiance (et au fichier téléchargé en CI), numérotation des étapes, ancres, ids, balises SEO |
| `tests/` | Chaque étape se charge sans erreur ; chaque leçon se rejoue (queue, pod recréé, canary, disjoncteur, bascule de région, alerte) |

## Publier

GitHub Pages publie la racine de `main` (« Deploy from a branch »), sans GitHub Actions.

1. Modifier `src/index.html`.
2. `npm run build`, puis `npm run check`.
3. Committer la source et les fichiers générés, pousser sur `main`. La page est en ligne une à deux minutes plus tard.

Le commentaire `<!-- build … -->` dans le `<head>` de la page en ligne indique l'empreinte de la source publiée.

## Intégration continue

`.github/workflows/ci.yml` tourne sur chaque pull request et chaque push sur `main` : contrôles statiques (dont « la racine est à jour »), puis tests Playwright. Le rapport est joint en cas d'échec. Il ne publie rien : le site ne dépend pas de lui.

Dependabot propose chaque mois les mises à jour des actions GitHub et de Playwright.
