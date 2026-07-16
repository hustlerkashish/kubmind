package io.kubemind.backend.service;

import io.kubemind.backend.dto.*;
import io.kubemind.backend.entity.PasswordReset;
import io.kubemind.backend.entity.RefreshToken;
import io.kubemind.backend.entity.Role;
import io.kubemind.backend.entity.User;
import io.kubemind.backend.exception.AppException;
import io.kubemind.backend.repository.PasswordResetRepository;
import io.kubemind.backend.repository.RefreshTokenRepository;
import io.kubemind.backend.repository.RoleRepository;
import io.kubemind.backend.repository.UserRepository;
import io.kubemind.backend.security.JwtTokenProvider;
import io.kubemind.backend.security.UserPrincipal;
import io.kubemind.backend.util.AppConstants;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetRepository passwordResetRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final RefreshTokenService refreshTokenService;

    @Transactional
    public JwtAuthResponse login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsernameOrEmail(),
                        loginRequest.getPassword()
                )
        );

        String accessToken = tokenProvider.generateToken(authentication);
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        RefreshToken refreshToken = refreshTokenService.createRefreshToken(userPrincipal.getId());

        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        return JwtAuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .user(mapToDto(user))
                .build();
    }

    @Transactional
    public UserDto register(RegisterRequest registerRequest) {
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new AppException("Username is already taken", HttpStatus.BAD_REQUEST);
        }

        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new AppException("Email address is already registered", HttpStatus.BAD_REQUEST);
        }

        String targetRole = AppConstants.ROLE_DEVELOPER;
        if (registerRequest.getRole() != null && registerRequest.getRole().equalsIgnoreCase("ADMIN")) {
            targetRole = AppConstants.ROLE_ADMIN;
        }

        final String roleName = targetRole;
        Role userRole = roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.save(Role.builder().name(roleName).build()));

        User user = User.builder()
                .username(registerRequest.getUsername())
                .email(registerRequest.getEmail())
                .fullName(registerRequest.getFullName())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .enabled(true)
                .roles(Collections.singleton(userRole))
                .build();

        User savedUser = userRepository.save(user);
        return mapToDto(savedUser);
    }

    @Transactional
    public TokenRefreshResponse refreshToken(TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        return refreshTokenRepository.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    UserPrincipal userPrincipal = UserPrincipal.create(user);
                    Authentication auth = new UsernamePasswordAuthenticationToken(userPrincipal, null, userPrincipal.getAuthorities());
                    String newAccessToken = tokenProvider.generateToken(auth);
                    return TokenRefreshResponse.builder()
                            .accessToken(newAccessToken)
                            .refreshToken(requestRefreshToken)
                            .tokenType("Bearer")
                            .build();
                })
                .orElseThrow(() -> new AppException("Refresh token is invalid or not in database", HttpStatus.FORBIDDEN));
    }

    @Transactional
    public String requestPasswordReset(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException("No registered operator account found with email: " + request.getEmail(), HttpStatus.NOT_FOUND));

        String resetToken = UUID.randomUUID().toString();
        PasswordReset passwordReset = PasswordReset.builder()
                .user(user)
                .token(resetToken)
                .expiryDate(Instant.now().plusSeconds(3600)) // 1 hour validity
                .used(false)
                .build();

        passwordResetRepository.save(passwordReset);
        return resetToken;
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordReset passwordReset = passwordResetRepository.findByToken(request.getToken())
                .orElseThrow(() -> new AppException("Invalid or expired password reset token", HttpStatus.BAD_REQUEST));

        if (passwordReset.getUsed() || passwordReset.getExpiryDate().isBefore(Instant.now())) {
            throw new AppException("Password reset token has expired or already been used", HttpStatus.BAD_REQUEST);
        }

        User user = passwordReset.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        passwordReset.setUsed(true);
        passwordResetRepository.save(passwordReset);
    }

    private UserDto mapToDto(User user) {
        Set<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roles)
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .build();
    }
}
