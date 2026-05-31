package com.terra.backend.repository;

import com.terra.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);
    List<Notification> findTop20ByUserIdOrderByCreatedAtDesc(Long userId);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.id = :userId AND n.id IN :notificationIds")
    void markAsRead(@Param("userId") Long userId, @Param("notificationIds") List<Long> notificationIds);

}
