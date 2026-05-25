package com.terra.backend.service;

import com.terra.backend.entity.Project;
import com.terra.backend.entity.Task;
import com.terra.backend.repository.TaskRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ContextCompressor {
    private final TaskRepository taskRepository;

    public ContextCompressor(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public String getCompressedBoardState(Long projectId) {
        List<Task> tasks = taskRepository.findByProjectId(projectId);
        
        // Filter out done tasks older than 14 days (logic simplified here)
        List<Task> activeTasks = tasks.stream()
                .filter(t -> t.getStatus() != Task.TaskStatus.DONE)
                .collect(Collectors.toList());

        return activeTasks.stream()
                .map(t -> String.format("ID:%d, Title:%s, Status:%s, Priority:%s", 
                        t.getId(), t.getTitle(), t.getStatus(), t.getPriority()))
                .collect(Collectors.joining("; "));
    }
}
