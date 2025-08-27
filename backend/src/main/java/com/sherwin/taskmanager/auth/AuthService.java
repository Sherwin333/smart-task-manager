package com.sherwin.taskmanager.auth;

import com.sherwin.taskmanager.security.JwtService;
import com.sherwin.taskmanager.user.User;
import com.sherwin.taskmanager.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
  private final UserRepository users;
  private final PasswordEncoder enc;   // <-- use interface, not BCryptPasswordEncoder
  private final JwtService jwt;

  public String login(String email, String password) {
    User u = users.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("User not found"));
    if (!enc.matches(password, u.getPasswordHash())) {
      throw new RuntimeException("Invalid credentials");
    }
    return jwt.generate(u.getEmail());
  }
}
