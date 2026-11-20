package io.kubemind.backend.controller;

import io.kubemind.backend.dto.*;
import io.kubemind.backend.security.UserPrincipal;
import io.kubemind.backend.service.AuthService;
import io.kubemind.backend.service.RefreshTokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication Gateway", description = "Operator login, registration, dual JWT token rotation & password resets")
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and issue access token & refresh token")
    public ResponseEntity<ApiResponse<JwtAuthResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        JwtAuthResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(ApiResponse.success(response, "Authentication successful"));
    }

    @PostMapping("/register")
    @Operation(summary = "Register new SRE operator or developer account")
    public ResponseEntity<ApiResponse<UserDto>> register(@Valid @RequestBody RegisterRequest registerRequest) {
        UserDto registeredUser = authService.register(registerRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(registeredUser, "Operator registered successfully"));
    }

    @PostMapping("/setup-admin")
    @Operation(summary = "Initialize primary administrator using secure one-time setup token")
    public ResponseEntity<ApiResponse<UserDto>> setupAdmin(@Valid @RequestBody SetupAdminRequest setupAdminRequest) {
        UserDto adminUser = authService.setupInitialAdmin(setupAdminRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(adminUser, "Initial administrator account initialized successfully"));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Exchange valid refresh token for a new access token")
    public ResponseEntity<ApiResponse<TokenRefreshResponse>> refreshToken(@Valid @RequestBody TokenRefreshRequest request) {
        TokenRefreshResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Token refreshed successfully"));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke user refresh tokens and invalidate current session")
    public ResponseEntity<ApiResponse<Void>> logout(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal != null) {
            refreshTokenService.deleteByUserId(userPrincipal.getId());
        }
        return ResponseEntity.ok(ApiResponse.success(null, "Session logged out successfully"));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset token for operator email")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.requestPasswordReset(request);
        return ResponseEntity.ok(ApiResponse.success(
                null,
                "If an account exists with that email address, password reset instructions have been dispatched."
        ));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Execute password reset with reset token")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Password reset successfully. You can now login with your new credentials."));
    }
}
