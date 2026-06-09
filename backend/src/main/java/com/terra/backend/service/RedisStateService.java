package com.terra.backend.service;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class RedisStateService {

    private static final String BLOCKLIST_PREFIX = "auth:blocklist:";
    private static final String REFRESH_PREFIX = "auth:refresh:";
    private static final String VERSION_PREFIX = "auth:version:";
    private static final String EPHEMERAL_PREFIX = "auth:ephemeral:";
    private static final String RATE_LIMIT_PREFIX = "ratelimit:";
    private static final String CONVERSATION_KEY_PREFIX = "ai:conv:";
    private final StringRedisTemplate redisTemplate;

    public RedisStateService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void blockToken(String jti, long ttlMs) {
        redisTemplate.opsForValue().set(BLOCKLIST_PREFIX + jti, "blocked", ttlMs, TimeUnit.MILLISECONDS);
    }

    public boolean isTokenBlocked(String jti) {
        return redisTemplate.hasKey(BLOCKLIST_PREFIX + jti);
    }

    public void saveRefreshToken(Long userId, String hashedToken, long ttlMs) {
        redisTemplate.opsForValue().set(REFRESH_PREFIX + userId, hashedToken, ttlMs, TimeUnit.MILLISECONDS);
    }

    public String getRefreshToken(Long userId) {
        return redisTemplate.opsForValue().get(REFRESH_PREFIX + userId);
    }

    public void deleteRefreshToken(Long userId) {
        redisTemplate.delete(REFRESH_PREFIX + userId);
    }

    public void incrementSessionVersion(Long userId) {
        redisTemplate.opsForValue().increment(VERSION_PREFIX + userId);
    }

    public int getSessionVersion(Long userId) {
        String version = redisTemplate.opsForValue().get(VERSION_PREFIX + userId);
        return version != null ? Integer.parseInt(version) : 0;
    }

    public void saveEphemeralToken(String key, String value, long ttlMs) {
        redisTemplate.opsForValue().set(EPHEMERAL_PREFIX + key, value, ttlMs, TimeUnit.MILLISECONDS);
    }

    public String getEphemeralToken(String key) {
        return redisTemplate.opsForValue().get(EPHEMERAL_PREFIX + key);
    }

    public void deleteEphemeralToken(String key) {
        redisTemplate.delete(EPHEMERAL_PREFIX + key);
    }

    public boolean isRateLimited(String key, int limit, long windowMs) {
        String redisKey = RATE_LIMIT_PREFIX + key;
        Long count = redisTemplate.opsForValue().increment(redisKey);
        if (count != null && count == 1) {
            redisTemplate.expire(redisKey, windowMs, TimeUnit.MILLISECONDS);
        }
        return count != null && count > limit;
    }

    public void addConversationMessage(Long userId, String role, String content) {
        String key = CONVERSATION_KEY_PREFIX + userId;
        String message = System.currentTimeMillis() + "|" + role + "|" + content;
        redisTemplate.opsForList().rightPush(key, message);
        redisTemplate.expire(key, Duration.ofMinutes(30)); // TTL 30 min
        // Keep only last 20 messages to avoid overflow
        Long size = redisTemplate.opsForList().size(key);
        if (size != null && size > 20) {
            redisTemplate.opsForList().leftPop(key);
        }
    }

    public List<String[]> getConversationHistory(Long userId, int limit) {
        String key = CONVERSATION_KEY_PREFIX + userId;
        List<String> messages = redisTemplate.opsForList().range(key, -limit, -1);
        if (messages == null) return List.of();
        return messages.stream()
                .map(msg -> msg.split("\\|", 3))
                .filter(parts -> parts.length == 3)
                .map(parts -> new String[]{parts[1], parts[2]}) // [role, content]
                .collect(Collectors.toList());
    }


}
