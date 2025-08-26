package com.sherwin.taskmanager.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

  private final SecretKey key;

  public JwtService(@Value("${app.jwt.secret:dev-secret-change-me}") String secret) {
    if (secret.length() < 32) {
      secret = (secret + "00000000000000000000000000000000").substring(0, 32);
    }
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
  }

  /** For AuthService */
  public String generate(String subject) {
    long now = System.currentTimeMillis();
    return Jwts.builder()
        .setSubject(subject)
        .setIssuedAt(new Date(now))
        .setExpiration(new Date(now + 1000L * 60 * 60 * 8)) // 8h
        .signWith(key, SignatureAlgorithm.HS256)
        .compact();
  }

  /** Optional alias if other code uses this name */
  public String generateToken(String subject) {
    return generate(subject);
  }

  public String extractUsername(String token) {
    return extractClaim(token, Claims::getSubject);
  }

  public boolean isTokenValid(String token, UserDetails user) {
    String username = extractUsername(token);
    return username != null && username.equals(user.getUsername()) && !isTokenExpired(token);
  }

  private boolean isTokenExpired(String token) {
    Date exp = extractClaim(token, Claims::getExpiration);
    return exp.before(new Date());
  }

  private <T> T extractClaim(String token, Function<Claims, T> resolver) {
    Claims claims = Jwts.parserBuilder()
        .setSigningKey(key)
        .build()
        .parseClaimsJws(token)
        .getBody();
    return resolver.apply(claims);
  }
}
