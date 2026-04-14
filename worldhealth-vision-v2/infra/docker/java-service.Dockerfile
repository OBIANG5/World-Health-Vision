# syntax=docker/dockerfile:1.7

# =============================================================================
# FICHIER : infra/docker/java-service.Dockerfile
# =============================================================================
#
# A QUOI SERT CE FICHIER ?
# -----------------------------------------------------------------------------
# Dockerfile partage pour les microservices Java Spring Boot de la V2.
#
# Pourquoi un Dockerfile partage ?
# - eviter les duplications entre services Java
# - garder une strategie de build coherente
# - garantir que tous les services compilent a partir de la racine Maven V2
#
# UTILISATION
# -----------------------------------------------------------------------------
# Le build doit fournir :
# - SERVICE_MODULE : ex: services/catalog-service
#
# Ce Dockerfile :
# 1. copie la racine Maven V2
# 2. compile uniquement le module cible + ses dependances reactor
# 3. extrait le jar construit
# 4. produit une image runtime simple
# =============================================================================

ARG MAVEN_VERSION=3.9.9
ARG JDK_IMAGE=eclipse-temurin:21-jdk
ARG JRE_IMAGE=eclipse-temurin:21-jre

FROM ${JDK_IMAGE} AS build

ARG SERVICE_MODULE

WORKDIR /workspace

COPY .mvn .mvn
COPY mvnw mvnw
COPY mvnw.cmd mvnw.cmd
COPY pom.xml pom.xml
COPY libs libs
COPY services services

RUN chmod +x mvnw
RUN ./mvnw -q -pl ${SERVICE_MODULE} -am -DskipTests package

FROM ${JRE_IMAGE} AS runtime

ARG SERVICE_MODULE

WORKDIR /app

COPY --from=build /workspace/${SERVICE_MODULE}/target/*.jar /app/app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
