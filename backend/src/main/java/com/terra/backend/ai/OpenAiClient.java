package com.terra.backend.ai;

import com.terra.backend.service.AiSettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class OpenAiClient implements LlmClient {

    @Value("${ai.openai.api.url:https://openrouter.ai/api/v1/chat/completions}")
    private String apiUrl;

    @Value("${ai.openai.model:openai/gpt-oss-120b:free}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();

    private  final AiSettingsService aiSettingsService;

    public OpenAiClient(AiSettingsService aiSettingsService) {
        this.aiSettingsService = aiSettingsService;
    }



    @Override
    public String generateResponse(String prompt) {
        String apiKey = aiSettingsService.getDecryptedApiKey();
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return "{\"actionType\": \"NONE\", \"message\": \"(Mock mode) مفتاح API غير مُعدّ. يرجى من المشرف إعداد مفتاح OpenRouter API.\"}";
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", List.of(message));
        requestBody.put("temperature", 0.3);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(apiUrl, HttpMethod.POST, request, Map.class);
            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) body.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> choice = choices.get(0);
                    Map<String, Object> resMessage = (Map<String, Object>) choice.get("message");
                    return (String) resMessage.get("content");
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to communicate with OpenRouter API", e);
        }

        return "{\"actionType\": \"NONE\", \"message\": \"Failed to parse OpenRouter response.\"}";
    }
}
