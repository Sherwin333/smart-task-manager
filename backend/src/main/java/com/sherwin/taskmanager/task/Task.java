package com.sherwin.taskmanager.task;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Task {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String title;

  @Column(nullable = false)
  private String status; // "Todo" | "In Progress" | "Done"

  @Column(nullable = false)
  private Integer position = 0; // order within a column
}
