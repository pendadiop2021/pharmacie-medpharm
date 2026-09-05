FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM maven:3.9-eclipse-temurin-17 AS backend-build
WORKDIR /app/backend
COPY backend/pom.xml ./
RUN mvn dependency:go-offline
COPY backend/ ./

COPY --from=frontend-build /app/frontend/dist/ /tmp/frontend-dist/
RUN INDEX_DIR=$(dirname "$(find /tmp/frontend-dist -name index.html | head -n 1)") && \
    echo "Frontend trouve dans : $INDEX_DIR" && \
    mkdir -p src/main/resources/static && \
    cp -r "$INDEX_DIR"/* src/main/resources/static/

RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend-build /app/backend/target/ventes-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
