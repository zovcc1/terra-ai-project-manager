package com.terra.backend.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class MarkNotificationReadRequest {
    private List<Long> notificationIds;
}
