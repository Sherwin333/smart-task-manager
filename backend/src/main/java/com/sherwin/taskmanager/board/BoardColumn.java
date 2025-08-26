package com.sherwin.taskmanager.board;

import com.sherwin.taskmanager.project.Project;
import jakarta.persistence.*;
import lombok.*;

@Entity @Getter @Setter @NoArgsConstructor
public class BoardColumn {
  @Id @GeneratedValue private Long id;
  @ManyToOne(optional=false) private Project project;
  @Column(nullable=false) private String name; // "Todo", "In Progress", "Done"
  @Column(nullable=false) private Integer position; // 0,1,2
}
