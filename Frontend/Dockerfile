FROM maven:3.9.9-eclipse-temurin-17 AS builder

WORKDIR /build/backend-java

COPY backend-java/pom.xml pom.xml
COPY backend-java/src src

RUN mvn -DskipTests package

FROM eclipse-temurin:17-jre

WORKDIR /app

COPY . .
COPY --from=builder /build/backend-java/target/backend-java-1.0.0.jar /app/backend-java/target/backend-java-1.0.0.jar

ENV PORT=8000

EXPOSE 8000

CMD ["java", "-jar", "backend-java/target/backend-java-1.0.0.jar"]
