#!/bin/bash
set -e

echo "==> Build du frontend Angular..."
cd frontend
npm install
npm run build
cd ..

echo "==> Copie du frontend dans le backend..."
rm -rf backend/src/main/resources/static
mkdir -p backend/src/main/resources/static
cp -r frontend/dist/pharmacie-frontend/browser/* backend/src/main/resources/static/

echo "==> Build du backend Spring Boot (jar unique, frontend inclus)..."
cd backend
mvn clean package -DskipTests
cd ..

echo "==> Termine. Le jar autonome est dans backend/target/ventes-1.0.0.jar"
