package com.sherwin.taskmanager.bootstrap;

import com.sherwin.taskmanager.task.Task;
import com.sherwin.taskmanager.task.TaskRepository;
import com.sherwin.taskmanager.user.User;
import com.sherwin.taskmanager.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class Dataloader implements CommandLineRunner {

  private final UserRepository users;
  private final TaskRepository tasks;
  private final PasswordEncoder enc;

  @Override
  public void run(String... args) {
    // Seed admin user
    users.findByEmail("admin@example.com").orElseGet(() -> {
      User u = new User();
      u.setEmail("admin@example.com");
      u.setName("Admin");
      u.setPasswordHash(enc.encode("admin123"));
      u.setRole(User.Role.ADMIN);
      return users.save(u);
    });

    // Seed tasks only if empty
    if (tasks.count() == 0) {
      Task t1 = new Task();
      t1.setTitle("Setup project");
      t1.setStatus("Todo");
      tasks.save(t1);

      Task t2 = new Task();
      t2.setTitle("Build login");
      t2.setStatus("In Progress");
      tasks.save(t2);

      Task t3 = new Task();
      t3.setTitle("Connect board API");
      t3.setStatus("Done");
      tasks.save(t3);
    }
  }
}
