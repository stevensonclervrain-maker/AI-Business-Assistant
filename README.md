# AI Business Assistant

Prototype d'une équipe d'agents pour organiser le travail d'une petite entreprise.

## État actuel

- `index.html` : interface web statique avec les agents et des outils locaux de préparation/analyse.
- `worker.js` : point de départ d'un backend sécurisé qui transmet les demandes au modèle IA côté serveur.
- `wrangler.toml` : configuration de départ pour Cloudflare Workers.

**Important :** le backend n'est pas encore déployé et l'interface n'est pas encore connectée à lui. Les fonctions visibles dans la page restent donc des outils de prototype; elles ne sont pas encore des agents IA autonomes.

## Architecture prévue

GitHub Pages (interface) → Cloudflare Worker (backend) → API du fournisseur IA.

La clé API doit rester dans un secret du serveur. Ne jamais la mettre dans `index.html`, dans le navigateur, ni dans un commit GitHub.

## Configuration du backend (à faire avec un adulte responsable)

L'utilisation d'une API IA peut entraîner des frais selon le fournisseur et l'usage. Avant d'activer un service payant, demandez à un parent/tuteur de vérifier les conditions d'âge, le compte et les coûts.

1. Déployer ce Worker sur un compte Cloudflare autorisé.
2. Définir les variables/ secrets côté serveur : `OPENAI_API_KEY` (secret), `OPENAI_MODEL` et `ALLOWED_ORIGIN`.
3. Garder `ALLOWED_ORIGIN` limité à l'origine GitHub Pages indiquée dans `wrangler.toml`.
4. Tester le endpoint avant de connecter l'interface.
5. Ajouter une limitation de débit et une protection anti-abus avant toute utilisation publique.

Le Worker accepte un POST JSON de la forme :

```json
{ "agent": "social", "prompt": "Analyse ce résumé de statistiques..." }
```

Les agents pris en charge sont : `manager`, `social`, `research`, `business`, `marketing`, `finance`, `content`, `ideas` et `quality`.

## Limites actuelles

- Aucun compte TikTok, Instagram, Facebook ou YouTube n'est connecté.
- Aucune publication ni programmation automatique n'est activée.
- L'analyse sociale utilise uniquement les statistiques saisies par l'utilisateur.
- La connexion au backend IA reste à réaliser et à tester.
