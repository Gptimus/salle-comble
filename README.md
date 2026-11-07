# Salle Comble · Monter une infra qui tient la charge

Simulateur 3D interactif (en français) : comment faire évoluer la billetterie d'une salle de concert en 18 étapes, du laptop du développeur jusqu'à Kubernetes.

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
- Pic de réservations : la queue se remplit puis se vide.
- Déploiement d'une version buguée : rolling update contre canary.

Les capacités, latences et prix affichés sont des ordres de grandeur issus d'un modèle simplifié.

Fichier unique : `index.html` (three.js chargé depuis jsDelivr).
