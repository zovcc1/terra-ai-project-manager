FROM maven:3.9-eclipse-temurin-17
WORKDIR /app
COPY . .
RUN chmod +x docker-entrypoint.sh
EXPOSE 8080
ENTRYPOINT ["./docker-entrypoint.sh"]
