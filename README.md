# Registre des ventes — Pharmacie (Angular + Spring Boot)

Application complète pour enregistrer les ventes d'une pharmacie, avec un
catalogue produits et le scan de codes-barres/QR via la caméra pour
pré-remplir automatiquement le prix.

## Structure

```
pharmacie-app/
├── backend/     Spring Boot 3 (Java 17), API REST, base H2 persistée sur disque
└── frontend/    Angular 17 (standalone components), scan caméra via @zxing/ngx-scanner
```

## 1. Lancer le backend (Spring Boot)

Prérequis : Java 17+ et Maven.

```bash
cd backend
mvn spring-boot:run
```

L'API démarre sur **http://localhost:8080**. Endpoints principaux :

- `GET  /api/produits` — liste des produits
- `GET  /api/produits/code/{code}` — recherche un produit par code-barres/QR
- `POST /api/produits` — créer/mettre à jour un produit (`{code, nom, prix}`)
- `DELETE /api/produits/{id}`
- `GET  /api/ventes?range=today|week|month|all` — liste des ventes
- `POST /api/ventes` — enregistrer une vente
- `DELETE /api/ventes/{id}`
- `GET  /api/ventes/stats` — statistiques (jour/mois)

La base de données H2 est stockée dans `backend/data/pharmaciedb.mv.db`
(persistée entre les redémarrages). Console H2 disponible sur
`http://localhost:8080/h2-console` (JDBC URL :
`jdbc:h2:file:./data/pharmaciedb`).

## 2. Lancer le frontend (Angular)

Prérequis : Node.js 18+ et npm.

```bash
cd frontend
npm install
npm start
```

L'application est accessible sur **http://localhost:4200**.

> Le scan caméra nécessite HTTPS ou `localhost`, et que le navigateur
> autorise l'accès à la caméra. En cas de refus ou d'absence de caméra,
> le code peut toujours être saisi manuellement dans le champ prévu.

## 3. Utilisation

1. Onglet **Produits** : enregistrez vos médicaments avec leur code-barres/QR
   et leur prix (scan ou saisie manuelle du code).
2. Onglet **Ventes** : scannez ou saisissez le code d'un produit — son nom et
   son prix se remplissent automatiquement. Ajustez la quantité, puis
   enregistrez la vente.
3. L'historique et les statistiques (jour/semaine/mois) se mettent à jour
   automatiquement.

## Notes de déploiement

- Pour la production, remplacez H2 par PostgreSQL/MySQL (ajustez
  `application.properties` et la dépendance dans `pom.xml`).
- Pensez à changer l'origine autorisée dans `CorsConfig.java` et l'URL de
  base des services Angular (`environment` recommandé) si le frontend et le
  backend ne sont plus sur `localhost`.
