package com.sherwin.taskmanager.bootstrap;

import com.sherwin.taskmanager.user.User;
import com.sherwin.taskmanager.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class Dataloader implements CommandLineRunner {
  private final UserRepository users;
  private final BCryptPasswordEncoder enc;

  @Override
  public void run(String... args) {
    users.findByEmail("admin@example.com").orElseGet(() -> {
      User u = new User();
      u.setEmail("admin@example.com");
      u.setName("Admin");
      u.setPasswordHash(enc.encode("admin123"));
      u.setRole(User.Role.ADMIN);
      return users.save(u);
    });
  }
}
