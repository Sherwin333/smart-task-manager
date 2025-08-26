package com.sherwin.taskmanager.project;

import com.sherwin.taskmanager.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Getter @Setter @NoArgsConstructor
public class Project {
  @Id @GeneratedValue private Long id;
  @Column(nullable=false) private String name;
  private String description;
  @ManyToOne(optional=false) private User owner;
  private Instant createdAt = Instant.now();
}
