package io.kubemind.backend.service;

import io.kubemind.backend.dto.ForgotPasswordRequest;
import io.kubemind.backend.dto.RegisterRequest;
import io.kubemind.backend.dto.ResetPasswordRequest;
import io.kubemind.backend.dto.SetupAdminRequest;
import io.kubemind.backend.dto.UserDto;
import io.kubemind.backend.entity.PasswordReset;
import io.kubemind.backend.entity.Role;
import io.kubemind.backend.entity.User;
import io.kubemind.backend.exception.AppException;
import io.kubemind.backend.repository.PasswordResetRepository;
import io.kubemind.backend.repository.RefreshTokenRepository;
import io.kubemind.backend.repository.RoleRepository;
import io.kubemind.backend.repository.UserRepository;
import io.kubemind.backend.security.JwtTokenProvider;
import io.kubemind.backend.util.AppConstants;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordResetRepository passwordResetRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "frontendBaseUrl", "https://app.kubemind.io");

        testUser = User.builder()
                .id(UUID.randomUUID())
                .username("operator")
                .email("operator@kubemind.io")
                .fullName("SRE Operator")
                .password("hashed_current_password")
                .enabled(true)
                .roles(Collections.emptySet())
                .build();
    }

    @Test
    @DisplayName("Existing email: Generates secure token, stores SHA-256 hash, and dispatches reset link via EmailService")
    void requestPasswordReset_ExistingEmail_DispatchesEmailAndStoresHashedToken() {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("operator@kubemind.io");

        when(userRepository.findByEmail("operator@kubemind.io")).thenReturn(Optional.of(testUser));
        when(passwordResetRepository.findByUserAndUsedFalse(testUser)).thenReturn(Collections.emptyList());

        authService.requestPasswordReset(request);

        // Verify email was dispatched with reset link containing the raw token
        ArgumentCaptor<String> emailCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> linkCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService, times(1)).sendPasswordResetEmail(emailCaptor.capture(), linkCaptor.capture());

        assertThat(emailCaptor.getValue()).isEqualTo("operator@kubemind.io");
        String resetLink = linkCaptor.getValue();
        assertThat(resetLink).startsWith("https://app.kubemind.io/forgot-password?token=");
        String rawToken = resetLink.substring(resetLink.indexOf("token=") + 6);
        assertThat(rawToken).isNotBlank();

        // Verify stored token in DB is the SHA-256 hash of the raw token, NEVER the raw token
        ArgumentCaptor<PasswordReset> resetCaptor = ArgumentCaptor.forClass(PasswordReset.class);
        verify(passwordResetRepository, times(1)).save(resetCaptor.capture());

        PasswordReset savedReset = resetCaptor.getValue();
        assertThat(savedReset.getUser()).isEqualTo(testUser);
        assertThat(savedReset.getToken()).isNotEqualTo(rawToken);
        assertThat(savedReset.getToken()).isEqualTo(sha256Hex(rawToken));
        assertThat(savedReset.getToken()).hasSize(64); // SHA-256 produces 64 hex characters
        assertThat(savedReset.getUsed()).isFalse();
        assertThat(savedReset.getExpiryDate()).isAfter(Instant.now());
    }

    @Test
    @DisplayName("Unknown email: Returns gracefully without throwing exception, creating tokens, or sending emails")
    void requestPasswordReset_UnknownEmail_ReturnsGracefullyWithoutException() {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("unknown-intruder@example.com");

        when(userRepository.findByEmail("unknown-intruder@example.com")).thenReturn(Optional.empty());

        // Must complete normally without throwing 404
        authService.requestPasswordReset(request);

        verify(passwordResetRepository, never()).save(any(PasswordReset.class));
        verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString());
    }

    @Test
    @DisplayName("Existing email with prior active tokens: Invalidates old tokens before issuing a new one")
    void requestPasswordReset_InvalidatesExistingUnusedTokens() {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("operator@kubemind.io");

        PasswordReset oldReset = PasswordReset.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .token("old_hashed_token")
                .expiryDate(Instant.now().plusSeconds(1800))
                .used(false)
                .build();

        when(userRepository.findByEmail("operator@kubemind.io")).thenReturn(Optional.of(testUser));
        when(passwordResetRepository.findByUserAndUsedFalse(testUser)).thenReturn(List.of(oldReset));

        authService.requestPasswordReset(request);

        assertThat(oldReset.getUsed()).isTrue();
        verify(passwordResetRepository, times(1)).saveAll(List.of(oldReset));
        verify(passwordResetRepository, times(1)).save(any(PasswordReset.class));
    }

    @Test
    @DisplayName("Email delivery failure: Handled safely without bubbling up exception to caller")
    void requestPasswordReset_EmailDeliveryFailure_HandledSafely() {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("operator@kubemind.io");

        when(userRepository.findByEmail("operator@kubemind.io")).thenReturn(Optional.of(testUser));
        when(passwordResetRepository.findByUserAndUsedFalse(testUser)).thenReturn(Collections.emptyList());
        doThrow(new RuntimeException("SMTP connect timed out"))
                .when(emailService).sendPasswordResetEmail(anyString(), anyString());

        // Must not throw exception
        authService.requestPasswordReset(request);

        verify(passwordResetRepository, times(1)).save(any(PasswordReset.class));
    }

    @Test
    @DisplayName("Valid reset token: Successfully updates password and marks token as used")
    void resetPassword_ValidToken_UpdatesPasswordAndMarksTokenUsed() {
        String rawToken = UUID.randomUUID().toString();
        String hashedToken = sha256Hex(rawToken);

        PasswordReset passwordReset = PasswordReset.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .token(hashedToken)
                .expiryDate(Instant.now().plusSeconds(1800))
                .used(false)
                .build();

        when(passwordResetRepository.findByToken(hashedToken)).thenReturn(Optional.of(passwordReset));
        when(passwordEncoder.encode("NewSecurePassword123!")).thenReturn("encoded_new_password");

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken(rawToken);
        request.setNewPassword("NewSecurePassword123!");

        authService.resetPassword(request);

        assertThat(testUser.getPassword()).isEqualTo("encoded_new_password");
        assertThat(passwordReset.getUsed()).isTrue();
        verify(userRepository, times(1)).save(testUser);
        verify(passwordResetRepository, times(1)).save(passwordReset);
    }

    @Test
    @DisplayName("Expired reset token: Rejected with BAD_REQUEST exception")
    void resetPassword_ExpiredToken_Rejected() {
        String rawToken = UUID.randomUUID().toString();
        String hashedToken = sha256Hex(rawToken);

        PasswordReset expiredReset = PasswordReset.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .token(hashedToken)
                .expiryDate(Instant.now().minusSeconds(60)) // Expired 1 minute ago
                .used(false)
                .build();

        when(passwordResetRepository.findByToken(hashedToken)).thenReturn(Optional.of(expiredReset));

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken(rawToken);
        request.setNewPassword("NewSecurePassword123!");

        assertThatThrownBy(() -> authService.resetPassword(request))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("expired or already been used")
                .matches(e -> ((AppException) e).getStatus() == HttpStatus.BAD_REQUEST);

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Reused reset token: Rejected with BAD_REQUEST exception")
    void resetPassword_ReusedToken_Rejected() {
        String rawToken = UUID.randomUUID().toString();
        String hashedToken = sha256Hex(rawToken);

        PasswordReset usedReset = PasswordReset.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .token(hashedToken)
                .expiryDate(Instant.now().plusSeconds(1800))
                .used(true) // Already used
                .build();

        when(passwordResetRepository.findByToken(hashedToken)).thenReturn(Optional.of(usedReset));

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken(rawToken);
        request.setNewPassword("NewSecurePassword123!");

        assertThatThrownBy(() -> authService.resetPassword(request))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("expired or already been used")
                .matches(e -> ((AppException) e).getStatus() == HttpStatus.BAD_REQUEST);

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Invalid token: Rejected with BAD_REQUEST exception")
    void resetPassword_InvalidToken_Rejected() {
        String nonExistentToken = "completely_invalid_token";
        String hashed = sha256Hex(nonExistentToken);

        when(passwordResetRepository.findByToken(hashed)).thenReturn(Optional.empty());
        when(passwordResetRepository.findByToken(nonExistentToken)).thenReturn(Optional.empty());

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken(nonExistentToken);
        request.setNewPassword("NewSecurePassword123!");

        assertThatThrownBy(() -> authService.resetPassword(request))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Invalid or expired password reset token")
                .matches(e -> ((AppException) e).getStatus() == HttpStatus.BAD_REQUEST);

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Normal registration cannot assign ROLE_ADMIN even if requested")
    void register_WhenAdminRoleRequested_AssignsDeveloperRoleOnly() {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("developer1");
        registerRequest.setEmail("dev1@kubemind.io");
        registerRequest.setPassword("dev_password_123");
        registerRequest.setFullName("Dev One");
        registerRequest.setRole("ADMIN"); // Attacker attempts privilege escalation

        Role devRole = Role.builder().name(AppConstants.ROLE_DEVELOPER).build();

        when(userRepository.existsByUsername("developer1")).thenReturn(false);
        when(userRepository.existsByEmail("dev1@kubemind.io")).thenReturn(false);
        when(roleRepository.findByName(AppConstants.ROLE_DEVELOPER)).thenReturn(Optional.of(devRole));
        when(passwordEncoder.encode("dev_password_123")).thenReturn("encoded_dev_pwd");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        UserDto registeredUser = authService.register(registerRequest);

        assertThat(registeredUser.getRoles()).containsExactly(AppConstants.ROLE_DEVELOPER);
        assertThat(registeredUser.getRoles()).doesNotContain(AppConstants.ROLE_ADMIN);
    }

    @Test
    @DisplayName("Initial admin setup: valid setup token creates initial administrator")
    void setupInitialAdmin_ValidToken_CreatesAdministrator() {
        ReflectionTestUtils.setField(authService, "configuredSetupToken", "secure-one-time-token-2026");

        SetupAdminRequest request = SetupAdminRequest.builder()
                .setupToken("secure-one-time-token-2026")
                .username("superadmin")
                .email("admin@kubemind.io")
                .fullName("System Superadmin")
                .password("SuperAdminPassword2026!")
                .build();

        Role adminRole = Role.builder().name(AppConstants.ROLE_ADMIN).build();
        Role devRole = Role.builder().name(AppConstants.ROLE_DEVELOPER).build();

        when(userRepository.existsByRoles_Name(AppConstants.ROLE_ADMIN)).thenReturn(false);
        when(userRepository.existsByUsername("superadmin")).thenReturn(false);
        when(userRepository.existsByEmail("admin@kubemind.io")).thenReturn(false);
        when(roleRepository.findByName(AppConstants.ROLE_ADMIN)).thenReturn(Optional.of(adminRole));
        when(roleRepository.findByName(AppConstants.ROLE_DEVELOPER)).thenReturn(Optional.of(devRole));
        when(passwordEncoder.encode("SuperAdminPassword2026!")).thenReturn("encoded_admin_pwd");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        UserDto adminDto = authService.setupInitialAdmin(request);

        assertThat(adminDto.getUsername()).isEqualTo("superadmin");
        assertThat(adminDto.getRoles()).contains(AppConstants.ROLE_ADMIN, AppConstants.ROLE_DEVELOPER);
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Initial admin setup: invalid setup token is rejected with UNAUTHORIZED")
    void setupInitialAdmin_InvalidToken_Rejected() {
        ReflectionTestUtils.setField(authService, "configuredSetupToken", "secure-one-time-token-2026");

        SetupAdminRequest request = SetupAdminRequest.builder()
                .setupToken("wrong-attacker-token")
                .username("hacker")
                .email("hacker@kubemind.io")
                .password("HackerPassword2026!")
                .build();

        when(userRepository.existsByRoles_Name(AppConstants.ROLE_ADMIN)).thenReturn(false);

        assertThatThrownBy(() -> authService.setupInitialAdmin(request))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Invalid setup token")
                .matches(e -> ((AppException) e).getStatus() == HttpStatus.UNAUTHORIZED);

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Initial admin setup: missing server setup token fails safely with FORBIDDEN")
    void setupInitialAdmin_MissingServerConfiguration_FailsSafely() {
        ReflectionTestUtils.setField(authService, "configuredSetupToken", "");

        SetupAdminRequest request = SetupAdminRequest.builder()
                .setupToken("some-token")
                .username("superadmin")
                .email("admin@kubemind.io")
                .password("SuperAdminPassword2026!")
                .build();

        when(userRepository.existsByRoles_Name(AppConstants.ROLE_ADMIN)).thenReturn(false);

        assertThatThrownBy(() -> authService.setupInitialAdmin(request))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Initial administrator setup is disabled or not configured")
                .matches(e -> ((AppException) e).getStatus() == HttpStatus.FORBIDDEN);

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Initial admin setup: cannot repeat setup when administrator already exists")
    void setupInitialAdmin_WhenAdminAlreadyExists_RejectedWithConflict() {
        ReflectionTestUtils.setField(authService, "configuredSetupToken", "secure-one-time-token-2026");

        SetupAdminRequest request = SetupAdminRequest.builder()
                .setupToken("secure-one-time-token-2026")
                .username("superadmin2")
                .email("admin2@kubemind.io")
                .password("SuperAdminPassword2026!")
                .build();

        when(userRepository.existsByRoles_Name(AppConstants.ROLE_ADMIN)).thenReturn(true);

        assertThatThrownBy(() -> authService.setupInitialAdmin(request))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("System initialization is already complete")
                .matches(e -> ((AppException) e).getStatus() == HttpStatus.CONFLICT);

        verify(userRepository, never()).save(any(User.class));
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
