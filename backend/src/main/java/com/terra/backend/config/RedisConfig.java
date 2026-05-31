package com.terra.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.beans.factory.annotation.Value;

/**
 * Configuration for Redis beans used throughout the application.
 *
 * The host and port are read from the standard Spring Boot properties:
 *   spring.redis.host
 *   spring.redis.port
 *
 * This mirrors the existing coding style in the project and provides
 * a {@link RedisConnectionFactory} and a {@link StringRedisTemplate} for
 * interacting with Redis.
 */
@Configuration
public class RedisConfig {

    @Value("${spring.redis.host}")
    private String redisHost;

    @Value("${spring.redis.port}")
    private int redisPort;

    @Bean(name = "redisConnectionFactory")
    public RedisConnectionFactory redisConnectionFactory() {
        return new LettuceConnectionFactory(redisHost, redisPort);
    }

    @Bean(name = "stringRedisTemplate")
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory redisConnectionFactory) {
        return new StringRedisTemplate(redisConnectionFactory);
    }
}
