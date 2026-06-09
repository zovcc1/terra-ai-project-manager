package com.terra.backend.service;

import com.terra.backend.dto.request.AiSettingsRequest;
import com.terra.backend.dto.response.AiSettingsResponse;
import com.terra.backend.entity.AiSettings;
import com.terra.backend.repository.AiSettingsRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
public class AiSettingsService {
    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES";
    private final AiSettingsRepository repository;
    @Value("${ai.encryption.key}")
    private String secretKey;

    public AiSettingsService(AiSettingsRepository repository) {
        this.repository = repository;
    }

    public AiSettingsResponse getSettings() {
        AiSettings settings = repository.findById(1L).orElse(new AiSettings());
        return AiSettingsResponse.builder()
                .provider(settings.getProvider())
                .model(settings.getModel())
                .apiKeyMasked(maskApiKey(decrypt(settings.getApiKeyEncrypted())))
                .enabled(settings.isEnabled())
                .defaultModel(settings.getDefaultModel())
                .build();
    }


    public String getActiveApiKey() {
        AiSettings settings = repository.findById(1L).orElseThrow(() ->
                new RuntimeException("AI settings not configured. Please set up the API key."));
        if (!settings.isEnabled()) {
            throw new RuntimeException("AI features are disabled. Enable them in admin settings.");
        }
        String key = decrypt(settings.getApiKeyEncrypted());
        if (key == null || key.isBlank()) {
            throw new RuntimeException("API key is missing or could not be decrypted.");
        }
        return key;
    }

    public void updateSettings(AiSettingsRequest request) {
        AiSettings settings = repository.findById(1L).orElse(new AiSettings());
        settings.setId(1L);
        if (request.getProvider() != null) settings.setProvider(request.getProvider());
        if (request.getModel() != null) settings.setModel(request.getModel());
        if (request.getApiKey() != null && !request.getApiKey().isEmpty()) {
            settings.setApiKeyEncrypted(encrypt(request.getApiKey()));
        }
        if (request.getEnabled() != null) settings.setEnabled(request.getEnabled());
        if (request.getDefaultModel() != null) settings.setDefaultModel(request.getDefaultModel());
        repository.save(settings);
    }

    private String encrypt(String value) {
        if (value == null) return null;
        try {
            SecretKeySpec keySpec = new SecretKeySpec(secretKey.substring(0, 16).getBytes(), ALGORITHM);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec);
            return Base64.getEncoder().encodeToString(cipher.doFinal(value.getBytes()));
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    private String decrypt(String encryptedValue) {
        if (encryptedValue == null) return null;
        try {
            SecretKeySpec keySpec = new SecretKeySpec(secretKey.substring(0, 16).getBytes(StandardCharsets.UTF_8), ALGORITHM);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, keySpec);
            byte[] decryptedBytes = cipher.doFinal(Base64.getDecoder().decode(encryptedValue));
            return new String(decryptedBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage());
        }
    }

    /**
     * Returns the decrypted API key for use by the LLM client.
     */
    public String getDecryptedApiKey() {
        AiSettings settings = repository.findById(1L).orElse(new AiSettings());
        if (!settings.isEnabled()) return null;
        String encrypted = settings.getApiKeyEncrypted();
        return decrypt(encrypted);
    }

    private String maskApiKey(String key) {
        if (key == null || key.length() < 8) return "غير مُعدّ";
        return "••••" + key.substring(key.length() - 4);
    }
}
