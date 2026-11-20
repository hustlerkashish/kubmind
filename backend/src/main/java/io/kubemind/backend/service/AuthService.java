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
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetRepository passwordResetRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final EmailService emailService;

    @Value("${app.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    @Value("${app.setup.token:}")
    private String configuredSetupToken;

    @Transactional
    public JwtAuthResponse login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsernameOrEmail(),
                        loginRequest.getPassword()));

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

        // Standard public registration is strictly restricted to non-administrative
        // roles
        Role userRole = roleRepository.findByName(AppConstants.ROLE_DEVELOPER)
                .orElseGet(() -> roleRepository.save(Role.builder().name(AppConstants.ROLE_DEVELOPER).build()));

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
    public UserDto setupInitialAdmin(SetupAdminRequest request) {
        if (userRepository.existsByRoles_Name(AppConstants.ROLE_ADMIN)) {
            throw new AppException(
                    "System initialization is already complete. An administrator account already exists.",
                    HttpStatus.CONFLICT);
        }

        // Require a configured setup token.
        if (configuredSetupToken == null || configuredSetupToken.isBlank()) {
            throw new AppException(
                    "Initial administrator setup is disabled or not configured on this server.",
                    HttpStatus.FORBIDDEN);
        }

        // Verify setup token using constant-time comparison.
        byte[] expectedBytes = configuredSetupToken.trim().getBytes(StandardCharsets.UTF_8);
        byte[] providedBytes = request.getSetupToken() != null
                ? request.getSetupToken().trim().getBytes(StandardCharsets.UTF_8)
                : new byte[0];

        if (!MessageDigest.isEqual(expectedBytes, providedBytes)) {
            log.warn("Unauthorized attempt to create administrator with invalid setup token");
            throw new AppException("Invalid setup token.", HttpStatus.UNAUTHORIZED);
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException("Username is already taken", HttpStatus.BAD_REQUEST);
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException("Email address is already registered", HttpStatus.BAD_REQUEST);
        }

        Role adminRole = roleRepository.findByName(AppConstants.ROLE_ADMIN)
                .orElseGet(() -> roleRepository.save(
                        Role.builder().name(AppConstants.ROLE_ADMIN).build()));

        Role devRole = roleRepository.findByName(AppConstants.ROLE_DEVELOPER)
                .orElseGet(() -> roleRepository.save(
                        Role.builder().name(AppConstants.ROLE_DEVELOPER).build()));

        User adminUser = User.builder()
                .username(request.getUsername().trim())
                .email(request.getEmail().trim())
                .fullName(request.getFullName())
                .password(passwordEncoder.encode(request.getPassword()))
                .enabled(true)
                .roles(Set.of(adminRole, devRole))
                .build();

        User savedAdmin = userRepository.save(adminUser);

        log.info("Administrator account successfully created for username: {}",
                savedAdmin.getUsername());

        return mapToDto(savedAdmin);
    }

    @Transactional
    public TokenRefreshResponse refreshToken(TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        return refreshTokenRepository.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    UserPrincipal userPrincipal = UserPrincipal.create(user);
                    Authentication auth = new UsernamePasswordAuthenticationToken(userPrincipal, null,
                            userPrincipal.getAuthorities());
                    String newAccessToken = tokenProvider.generateToken(auth);
                    return TokenRefreshResponse.builder()
                            .accessToken(newAccessToken)
                            .refreshToken(requestRefreshToken)
                            .tokenType("Bearer")
                            .build();
                })
                .orElseThrow(
                        () -> new AppException("Refresh token is invalid or not in database", HttpStatus.FORBIDDEN));
    }

    @Transactional
    public void requestPasswordReset(ForgotPasswordRequest request) {
        String email = (request.getEmail() != null) ? request.getEmail().trim() : "";
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            log.info("Password reset requested for unrecognized email address");
            return;
        }

        User user = userOpt.get();

        // Invalidate previous active unused reset tokens for this user
        List<PasswordReset> activeTokens = passwordResetRepository.findByUserAndUsedFalse(user);
        for (PasswordReset activeToken : activeTokens) {
            activeToken.setUsed(true);
        }
        if (!activeTokens.isEmpty()) {
            passwordResetRepository.saveAll(activeTokens);
        }

        // Generate cryptographically secure random token and store its SHA-256 hash
        String rawToken = UUID.randomUUID().toString();
        String hashedToken = hashToken(rawToken);

        PasswordReset passwordReset = PasswordReset.builder()
                .user(user)
                .token(hashedToken)
                .expiryDate(Instant.now().plusSeconds(3600)) // 1 hour validity
                .used(false)
                .createdAt(Instant.now())
                .build();

        passwordResetRepository.save(passwordReset);

        // Build reset link using configurable frontend base URL
        String cleanBaseUrl = (frontendBaseUrl != null) ? frontendBaseUrl.replaceAll("/+$", "")
                : "http://localhost:3000";
        String resetLink = cleanBaseUrl + "/forgot-password?token=" + rawToken;

        try {
            emailService.sendPasswordResetEmail(user.getEmail(), resetLink);
        } catch (Exception ex) {
            log.error("Failed to dispatch password reset email: {}", ex.getMessage());
        }
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String rawToken = (request.getToken() != null) ? request.getToken().trim() : "";
        String hashedToken = hashToken(rawToken);

        PasswordReset passwordReset = passwordResetRepository.findByToken(hashedToken)
                .or(() -> passwordResetRepository.findByToken(rawToken))
                .orElseThrow(() -> new AppException("Invalid or expired password reset token", HttpStatus.BAD_REQUEST));

        if (Boolean.TRUE.equals(passwordReset.getUsed()) || passwordReset.getExpiryDate().isBefore(Instant.now())) {
            throw new AppException("Password reset token has expired or already been used", HttpStatus.BAD_REQUEST);
        }

        User user = passwordReset.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        passwordReset.setUsed(true);
        passwordResetRepository.save(passwordReset);

        log.info("Password reset successfully executed for user ID: {}", user.getId());
    }

    private String hashToken(String token) {
        if (token == null) {
            return null;
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
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
