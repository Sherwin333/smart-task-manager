package com.sherwin.taskmanager.auth;

import com.sherwin.taskmanager.auth.dto.LoginRequest;
import com.sherwin.taskmanager.auth.dto.LoginResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService auth;

  @PostMapping("/login")
  public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest body) {
    String token = auth.login(body.email(), body.password());
    return ResponseEntity.ok(new LoginResponse(token));
  }
}
