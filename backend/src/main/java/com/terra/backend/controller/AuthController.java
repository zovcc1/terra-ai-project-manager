package com.terra.backend.controller;

import com.terra.backend.dto.LoginRequest;
import com.terra.backend.dto.TokenResponse;
import com.terra.backend.dto.request.ForgotPasswordRequest;
import com.terra.backend.dto.request.RegisterRequest;
import com.terra.backend.dto.request.ResetPasswordRequest;
import com.terra.backend.dto.request.VerifyEmailRequest;
import com.terra.backend.entity.Role;
import com.terra.backend.entity.User;
import com.terra.backend.repository.UserRepository;
import com.terra.backend.service.AuthenticationService;
import com.terra.backend.service.EmailService;
import com.terra.backend.service.RedisStateService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationService authenticationService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RedisStateService redisStateService;
    private final EmailService emailService;

    public AuthController(AuthenticationService authenticationService, UserRepository userRepository,
                          PasswordEncoder passwordEncoder, RedisStateService redisStateService,
                          EmailService emailService) {
        this.authenticationService = authenticationService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.redisStateService = redisStateService;
        this.emailService = emailService;
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@RequestBody LoginRequest loginRequest) {
        return ResponseEntity.ok(authenticationService.login(loginRequest));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email already registered"));
        }
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Username already taken"));
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(Role.USER)
                .status(User.UserStatus.PENDING)
                .build();
        userRepository.save(user);

        String token = UUID.randomUUID().toString();
        redisStateService.saveEphemeralToken("verify:" + request.getEmail(), token, 900000L);
        emailService.sendVerificationEmail(request.getEmail(), token);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Registered. Verify your email."));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        String stored = redisStateService.getEphemeralToken("verify:" + request.getEmail());
        if (stored == null || !stored.equals(request.getToken())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Invalid or expired token"));
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setStatus(User.UserStatus.ACTIVE);
        userRepository.save(user);
        redisStateService.deleteEphemeralToken("verify:" + request.getEmail());

        return ResponseEntity.ok(Map.of("message", "Email verified. You may now log in."));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        // Always return 200 to avoid email enumeration
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            redisStateService.saveEphemeralToken("reset:" + request.getEmail(), token, 3600000L);
            emailService.sendPasswordResetEmail(request.getEmail(), token);
        });
        return ResponseEntity.ok(Map.of("message", "If an account exists, a reset link has been sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        String stored = redisStateService.getEphemeralToken("reset:" + request.getEmail());
        if (stored == null || !stored.equals(request.getToken())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Invalid or expired token"));
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        redisStateService.deleteEphemeralToken("reset:" + request.getEmail());

        return ResponseEntity.ok(Map.of("message", "Password reset successfully."));
    }
}
