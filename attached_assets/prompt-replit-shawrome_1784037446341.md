# PROMPT REPLIT AI — Plateforme "Shawrome" (Vente de Voitures)

## CONTEXTE DU PROJET

Je veux construire une plateforme complète de vente de voitures composée de **3 interfaces** partageant la même base de données :

1. **Panneau Admin** (web) — gestion totale de la plateforme
2. **Site Vendeur** (web) — espace pour les vendeurs
3. **Application Mobile Client** (mobile) — pour les acheteurs

---

## STACK TECHNIQUE

- **Site web (Admin + Vendeur)** : React + Vite (frontend), Node.js + Express (backend)
- **Application mobile (Client)** : React Native (Expo), Node.js + Express (backend partagé)
- **Base de données** : PostgreSQL (Neon), avec Drizzle ORM (ou Prisma)
- **Authentification** : JWT avec rôles (admin / vendeur), sessions séparées
- **Stockage images** : Cloudinary (upload multi-photos par voiture)
- **Export de données** : ExcelJS (fichiers .xlsx détaillés et formatés professionnellement)
- **Graphiques statistiques** : Recharts (web) / Victory Native (mobile)
- **Monorepo** : pnpm workspaces (frontend web / backend / mobile / packages partagés)

---

## MODÈLE DE DONNÉES (SCHÉMA PRINCIPAL)

### Table `voitures`
- id, marque, modèle, année, kilométrage, description
- **prix_achat** (coût réel — nécessaire pour calculer le profit)
- **prix_vente_actuel** (prix affiché aux clients)
- carburant, transmission, couleur, état (neuf/occasion)
- statut (disponible / réservé / vendu)
- photos (tableau d'URLs Cloudinary)
- vendeur_id (qui gère cette voiture)
- date_ajout, date_vente (nullable)

### Table `historique_prix`
- id, voiture_id, ancien_prix, nouveau_prix, modifié_par (vendeur/admin), date_modification
- *(chaque changement de prix par le vendeur est automatiquement journalisé ici)*

### Table `ventes`
- id, voiture_id, prix_vente_final, prix_achat, profit (calculé), date_vente
- *(alimente les statistiques jour/semaine/mois/année)*

### Table `utilisateurs`
- id, nom, email, mot_de_passe (hashé bcrypt), rôle (admin / vendeur), actif (bool)

### Table `favoris` (optionnel, côté client)
- id, client_id, voiture_id

---

## 1. PANNEAU ADMIN (Web)

### Gestion des voitures
- Ajouter une voiture : upload multi-photos, kilométrage, description, marque, modèle, année, prix d'achat, prix de vente, carburant, transmission, couleur, état
- Modifier ou supprimer une voiture existante
- Voir le statut de chaque voiture (disponible / réservé / vendu)

### Statistiques et profit
- Dashboard avec **pourcentage de profit et de perte** : par jour, semaine, mois, année
- Graphiques d'évolution (courbes/barres) des ventes et du profit
- **Top 5 des voitures les mieux vendues** (aujourd'hui, cette semaine, ce mois)
- Liste des voitures vendues avec filtre par période

### Historique des prix
- Voir la liste des voitures dont le prix a changé, avec **ancien prix ET nouveau prix** affichés côte à côte
- Exemple : Admin ajoute à 1500 → Vendeur baisse à 1000 avant la vente → les statistiques utilisent le prix final (1000) pour le profit, mais l'admin voit toujours les deux valeurs (1500 → 1000) dans l'historique

### Export professionnel
- Export Excel (.xlsx) détaillé et formaté : en-têtes stylés, couleurs, totaux, filtres par période
- Feuilles séparées : Ventes, Profit/Perte, Historique des prix, Stock actuel

### Gestion des vendeurs
- Créer/désactiver des comptes vendeurs
- Voir les statistiques par vendeur (qui vend le plus, qui baisse le plus les prix)

---

## 2. SITE VENDEUR (Web)

- Connexion sécurisée (JWT, rôle vendeur)
- Voir uniquement **ses propres voitures** assignées
- Ajouter / modifier une voiture (mêmes champs que l'admin, sauf suppression réservée à l'admin — à confirmer selon tes règles métier)
- **Changer le prix de vente** → déclenche automatiquement une entrée dans `historique_prix`
- Marquer une voiture comme vendue (déclenche le calcul de profit et alimente les stats admin)
- Dashboard vendeur simplifié : ses ventes du jour/semaine/mois

---

## 3. APPLICATION MOBILE CLIENT (React Native)

### Design
- Interface **ultra professionnelle**, animations 3D dynamiques (ex : rotation de voiture, hero banner animé, transitions fluides)
- Thème sombre/clair, design showroom premium (inspiration : apps automobiles haut de gamme)

### Fonctionnalités
- Parcourir toutes les voitures disponibles avec photos, détails complets
- Filtres : marque, prix, année, kilométrage, carburant, transmission
- Recherche par mot-clé
- Fiche détaillée par voiture (galerie photos, toutes les infos, bouton contact)
- Bouton contact direct (WhatsApp / appel) vers le vendeur
- Favoris (nécessite un compte client léger, email/téléphone)
- Notifications push en option (baisse de prix sur une voiture favorite)

---

## FONCTIONNALITÉS COMPLÉMENTAIRES (pour une plateforme 100% complète)

Ces points ne sont pas mentionnés explicitement mais sont nécessaires pour une plateforme professionnelle et fonctionnelle :

- **Authentification par rôle** (admin/vendeur) avec JWT + refresh token
- **Validation des données** côté backend (champs obligatoires, formats)
- **Gestion des erreurs** propre (messages clairs, codes HTTP corrects)
- **Pagination** sur les listes de voitures (mobile + web)
- **Responsive design** complet pour le site vendeur/admin
- **Logs d'activité** (qui a fait quoi et quand — audit trail)
- **Sauvegarde automatique** des images en plusieurs résolutions (thumbnail + full)
- **SEO de base** pour le site vendeur (si les voitures doivent être indexables)
- **Multilingue** (français/arabe) si le marché cible est l'Algérie
- **Devise** configurable (DZD par défaut)
- **Déploiement** : Vercel (frontend web), Render (backend), Neon (DB), EAS Build (mobile)

---

## LIVRABLE ATTENDU

Une plateforme complète, fonctionnelle à 100%, avec :
1. Backend Node.js/Express unique servant les 3 interfaces (avec permissions par rôle)
2. Frontend Admin + Vendeur (React + Vite)
3. Application mobile Client (React Native / Expo)
4. Base de données PostgreSQL (Neon) avec le schéma ci-dessus
5. Code propre, commenté, prêt pour un handoff (variables d'environnement séparées, pas de clés en dur dans le code)

---

utiliser ce lien de DB : postgresql://neondb_owner:npg_jvlhG9AZR1pW@ep-sweet-union-atcw38di-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
