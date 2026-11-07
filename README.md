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

La page est un seul fichier, `src/index.html` (three.js chargé depuis jsDelivr, version figée, avec Subresource Integrity).

```bash
npm ci
npx playwright install chromium   # une fois
npm run build                     # src/ → dist/, génère robots.txt et sitemap.xml
npm run check                     # contrôles statiques (--online : télécharge et vérifie les empreintes SRI)
npm test                          # reconstruit dist/, puis tests navigateur (Playwright, ordinateur et mobile)
npm run serve                     # http://localhost:4173
```

| Fichier | Rôle |
| --- | --- |
| `src/index.html` | La page : HTML, CSS, simulation et scène 3D |
| `src/og.png` | Image de partage (1200 × 630) |
| `scripts/build.mjs` | Copie `src/` dans `dist/`, ajoute le numéro de build, génère `robots.txt` et `sitemap.xml` |
| `scripts/check.mjs` | Syntaxe du script, versions figées, empreintes SRI comparées à une liste de confiance (et au fichier téléchargé en CI), numérotation des étapes, ancres, ids, balises SEO |
| `tests/` | Chaque étape se charge sans erreur ; chaque leçon se rejoue (queue, pod recréé, canary, disjoncteur, bascule de région, alerte) |

## Intégration et déploiement

`.github/workflows/ci.yml` :

- **Chaque pull request** : build, contrôles statiques, tests Playwright. Le rapport est joint en cas d'échec.
- **Chaque push sur `main`** : la même chose, puis déploiement sur GitHub Pages, puis vérification que le site en ligne sert bien ce build.

Dependabot propose chaque mois les mises à jour des actions GitHub et de Playwright.
