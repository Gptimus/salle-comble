# Salle Comble · Monter une infra qui tient la charge

Simulateur 3D interactif (en français) : comment faire évoluer la billetterie d'une salle de concert en 8 étapes, du laptop du développeur à la base de données répliquée.

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

## Simulation

- Charge de 10 à 10 millions de fans (échelle logarithmique).
- Moteur de files d'attente : latence médiane et p99, taux d'erreur, historique sur une minute.
- Scénarios : manuel, ouverture des ventes (×30 en 2 s), journée type.
- Pannes : serveur applicatif, load balancer, base lente.

Les capacités, latences et prix affichés sont des ordres de grandeur issus d'un modèle simplifié.

Fichier unique : `index.html` (three.js chargé depuis jsDelivr).
