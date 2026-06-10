package com.terra.backend.repository;

import com.terra.backend.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByTaskId(Long taskId);

    List<Comment> findByTaskIdOrderByCreatedAtAsc(Long taskId);

    List<Comment> findByTaskIdIn(Collection<Long> taskIds);
}
