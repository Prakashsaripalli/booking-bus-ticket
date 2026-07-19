FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY Frontend/backend-java/pom.xml Frontend/backend-java/pom.xml
COPY Frontend/backend-java/src Frontend/backend-java/src

RUN mvn -f Frontend/backend-java/pom.xml -DskipTests package

FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /app/Frontend/backend-java/target/backend-java-1.0.0.jar /app/backend-java.jar
COPY Frontend /app/Frontend

ENV PORT=8000
ENV FRONTEND_DIR=/app/Frontend

EXPOSE 8000

CMD ["java", "-jar", "/app/backend-java.jar"]
