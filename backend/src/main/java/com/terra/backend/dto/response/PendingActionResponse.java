package com.terra.backend.dto.response;

import com.terra.backend.entity.PendingAction;
import lombok.Data;

@Data
public class PendingActionResponse {
    private Long id;
    private Long userId;
    private String actionType;
    private Long targetId;
    private String naturalLanguageCommand;
    private String status;

    public static PendingActionResponse fromEntity(PendingAction action) {
        PendingActionResponse r = new PendingActionResponse();
        r.setId(action.getId());
        r.setUserId(action.getUser() != null ? action.getUser().getId() : null);
        r.setActionType(action.getActionType() != null ? action.getActionType().name() : null);
        r.setTargetId(action.getTargetId());
        r.setNaturalLanguageCommand(action.getNaturalLanguageCommand());
        r.setStatus(action.getStatus() != null ? action.getStatus().name() : null);
        return r;
    }
}
