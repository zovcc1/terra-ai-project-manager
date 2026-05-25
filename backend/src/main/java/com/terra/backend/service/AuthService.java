package com.terra.backend.service;

import com.terra.backend.dto.LoginRequest;
import com.terra.backend.dto.TokenResponse;
import com.terra.backend.entity.User;
import com.terra.backend.repository.UserRepository;
import com.terra.backend.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final TokenService tokenService;

    public AuthService(AuthenticationManager authenticationManager, JwtTokenProvider tokenProvider, 
                       UserRepository userRepository, TokenService tokenService) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
        this.tokenService = tokenService;
    }

    public TokenResponse login(LoginRequest loginRequest) {
        String emailOrUsername = loginRequest.getEmail() != null ? loginRequest.getEmail() : loginRequest.getUsername();

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(emailOrUsername, loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(authentication);

        User user = userRepository.findByEmail(emailOrUsername)
                .or(() -> userRepository.findByUsername(emailOrUsername))
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        tokenService.storeRefreshToken(user.getEmail(), refreshToken, 604800000L); // 7 days, matching jwt.refreshExpirationMs

        List<String> roles = List.of(user.getRole().name());

        return new TokenResponse(jwt, refreshToken, "Bearer", user.getId(), user.getEmail(), roles);
    }
}
