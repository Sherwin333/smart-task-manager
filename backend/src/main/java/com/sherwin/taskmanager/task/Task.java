package com.sherwin.taskmanager.task;

import com.sherwin.taskmanager.board.BoardColumn;
import com.sherwin.taskmanager.project.Project;
import com.sherwin.taskmanager.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;

@Entity @Getter @Setter @NoArgsConstructor
public class Task {
  @Id @GeneratedValue private Long id;
  @ManyToOne(optional=false) private Project project;
  @ManyToOne(optional=false) private BoardColumn column;
  @Column(nullable=false) private String title;
  @Column(length=4000) private String description;
  @Enumerated(EnumType.STRING) private Priority priority = Priority.MEDIUM;
  private LocalDate dueDate;
  @ManyToOne private User assignee;
  private Double position = 1000d;
  private Instant createdAt = Instant.now();
  private Instant updatedAt = Instant.now();
  @PreUpdate void onUpdate(){ this.updatedAt = Instant.now(); }
  public enum Priority { LOW, MEDIUM, HIGH }
}
