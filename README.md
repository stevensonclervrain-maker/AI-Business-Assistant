# AI Business Assistant

Équipe multi-agents pour aider à analyser, planifier et préparer des décisions d'entreprise.

## Agents disponibles

- AI Manager : coordonne les demandes et synthétise les décisions.
- Équipe complète : fait travailler Research, Business, Finance, Marketing, Sales et Operations en parallèle, puis lance un audit indépendant et une synthèse finale.
- Social Media, Research, Business, Marketing, Finance, Content et Business Ideas.
- Quality Control : cherche les erreurs, hypothèses fragiles et risques.
- Sales, Customer Service, Operations, Automation et Decision Analyst.

## Qualité des décisions

Les agents doivent distinguer les faits, hypothèses, estimations et informations inconnues; signaler les données manquantes; montrer les risques et compromis; proposer plusieurs options et un prochain test mesurable. Le contrôle qualité doit pouvoir contester les autres agents. Les décisions importantes restent à valider par l'utilisateur.

## Architecture

GitHub Pages (interface) → Cloudflare Worker (backend) → Cloudflare Workers AI (modèle côté serveur).

Le Worker utilise le binding Cloudflare Workers AI nommé `AI`. Aucun secret d'API ne doit être placé dans `index.html`, dans le navigateur ou dans GitHub.

## Configuration

1. Déployer le Worker `worker.js` sur Cloudflare.
2. Vérifier que le binding Workers AI porte exactement le nom `AI`.
3. Configurer `ALLOWED_ORIGIN` avec l'origine exacte du site GitHub Pages.
4. Copier l'adresse HTTPS du Worker dans le champ « Adresse du backend » de l'application et enregistrer.
5. Tester un agent individuel, puis « Équipe complète ».

Le Worker accepte un POST JSON :

```json
{ "agent": "team", "prompt": "Évalue cette idée de petite entreprise..." }
```

## Limites et précautions

- Les agents ne naviguent pas automatiquement sur Internet et ne vérifient pas les actualités en direct. Ils ne doivent jamais inventer de sources.
- Aucun compte TikTok, Instagram, Facebook ou YouTube n'est connecté.
- Aucune publication, programmation ou action externe n'est exécutée automatiquement.
- Les recommandations financières sont des analyses indicatives, pas une garantie de bénéfice.
- L'équipe complète effectue plusieurs appels au modèle; surveiller les quotas et limites du compte Cloudflare.
- Avant toute utilisation réelle, tester les résultats et garder une validation humaine pour les décisions et publications importantes.
