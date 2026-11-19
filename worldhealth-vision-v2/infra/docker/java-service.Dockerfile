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

# Maven is preinstalled in the official builder image. The prior JDK-only
# build executed mvnw, which changed ZIP to .tar.gz when unzip was absent and
# could fail to fetch Maven before any project code was compiled.
# Lock to the same Maven version as .mvn/wrapper/maven-wrapper.properties.
# Pin this tag to a reviewed digest before a real production release.
ARG MAVEN_BUILDER_IMAGE=maven:3.9.9-eclipse-temurin-21
ARG JRE_IMAGE=eclipse-temurin:21-jre

FROM ${MAVEN_BUILDER_IMAGE} AS build

ARG SERVICE_MODULE

WORKDIR /workspace

COPY .mvn .mvn
COPY mvnw mvnw
COPY mvnw.cmd mvnw.cmd
COPY pom.xml pom.xml
COPY libs libs
COPY services services

RUN mvn -B -ntp -q -pl ${SERVICE_MODULE} -am -DskipTests package

FROM ${JRE_IMAGE} AS runtime

ARG SERVICE_MODULE

WORKDIR /app

COPY --from=build /workspace/${SERVICE_MODULE}/target/*.jar /app/app.jar

# Run the application as a dedicated unprivileged user. Runtime writes, if any,
# must go to an explicitly mounted volume or staging tmpfs (not the image root).
RUN groupadd --system --gid 10001 whv && useradd --system --uid 10001 --gid whv --no-create-home whv
USER 10001:10001

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]