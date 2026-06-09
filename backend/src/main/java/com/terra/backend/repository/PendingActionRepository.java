package com.terra.backend.repository;

import com.terra.backend.entity.PendingAction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PendingActionRepository extends JpaRepository<PendingAction, Long> {
    List<PendingAction> findByUserIdAndStatus(Long userId, PendingAction.ActionStatus status);
}
