FROM oven/bun:1
WORKDIR /app
COPY . .
RUN chmod +x docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
