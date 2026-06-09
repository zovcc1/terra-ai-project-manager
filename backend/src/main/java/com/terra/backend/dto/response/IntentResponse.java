package com.terra.backend.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class IntentResponse {
    private boolean needsData;
    private List<Long> projectIds;
    private String message;
}
