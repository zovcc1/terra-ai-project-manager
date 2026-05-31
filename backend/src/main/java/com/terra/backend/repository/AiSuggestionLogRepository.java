package com.terra.backend.repository;

import com.terra.backend.entity.AiSuggestionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AiSuggestionLogRepository extends JpaRepository<AiSuggestionLog, Long> {
    List<AiSuggestionLog> findByProjectIdAndIsDismissedFalse(Long projectId);
    List<AiSuggestionLog> findBySuggestionTypeAndIsDismissedFalse(String suggestionType);
}
