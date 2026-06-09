package com.terra.backend.exception;

public class LlmClientException extends RuntimeException {

    public LlmClientException(String message, String responseBody) {
        super(message);
    }
}
