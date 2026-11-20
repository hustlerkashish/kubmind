package io.kubemind.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.kubemind.backend.dto.ForgotPasswordRequest;
import io.kubemind.backend.dto.ResetPasswordRequest;
import io.kubemind.backend.dto.SetupAdminRequest;
import io.kubemind.backend.dto.UserDto;
import io.kubemind.backend.service.AuthService;
import io.kubemind.backend.service.RefreshTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;

    private ObjectMapper objectMapper;

    @Mock
    private AuthService authService;

    @Mock
    private RefreshTokenService refreshTokenService;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("Existing email: returns generic HTTP 200, null data, and NEVER leaks the reset token")
    void forgotPassword_ExistingEmail_ReturnsGenericResponseWithoutToken() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("operator@kubemind.io");

        doNothing().when(authService).requestPasswordReset(any(ForgotPasswordRequest.class));

        MvcResult result = mockMvc.perform(post("/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("If an account exists with that email address, password reset instructions have been dispatched."))
                .andExpect(jsonPath("$.data").doesNotExist())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        // Crucial security verification: resetToken must NEVER appear in the response payload
        assertThat(responseBody).doesNotContain("resetToken");
        assertThat(responseBody).doesNotContain("token");

        verify(authService, times(1)).requestPasswordReset(any(ForgotPasswordRequest.class));
    }

    @Test
    @DisplayName("Unknown email: returns identical generic HTTP 200 response to prevent email enumeration")
    void forgotPassword_UnknownEmail_ReturnsIdenticalGenericResponse() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("nonexistent-attacker-target@kubemind.io");

        // Service returns normally without error
        doNothing().when(authService).requestPasswordReset(any(ForgotPasswordRequest.class));

        MvcResult result = mockMvc.perform(post("/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("If an account exists with that email address, password reset instructions have been dispatched."))
                .andExpect(jsonPath("$.data").doesNotExist())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        assertThat(responseBody).doesNotContain("resetToken");
        assertThat(responseBody).doesNotContain("token");

        verify(authService, times(1)).requestPasswordReset(any(ForgotPasswordRequest.class));
    }

    @Test
    @DisplayName("Reset password: executes successfully with valid token")
    void resetPassword_ValidRequest_ReturnsSuccess() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("valid-secret-token-uuid");
        request.setNewPassword("NewSecurePassword2026!");

        doNothing().when(authService).resetPassword(any(ResetPasswordRequest.class));

        mockMvc.perform(post("/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Password reset successfully. You can now login with your new credentials."));

        verify(authService, times(1)).resetPassword(any(ResetPasswordRequest.class));
    }

    @Test
    @DisplayName("Setup admin: valid setup token returns 201 Created with UserDto")
    void setupAdmin_ValidToken_ReturnsCreated() throws Exception {
        SetupAdminRequest request = SetupAdminRequest.builder()
                .setupToken("one-time-setup-token-secret")
                .username("cluster_admin")
                .email("admin@kubemind.io")
                .fullName("Cluster Administrator")
                .password("SecureAdminPassword2026!")
                .build();

        UserDto adminDto = UserDto.builder()
                .id(java.util.UUID.randomUUID())
                .username("cluster_admin")
                .email("admin@kubemind.io")
                .fullName("Cluster Administrator")
                .roles(java.util.Set.of("ROLE_ADMIN", "ROLE_DEVELOPER"))
                .build();

        when(authService.setupInitialAdmin(any(SetupAdminRequest.class))).thenReturn(adminDto);

        mockMvc.perform(post("/auth/setup-admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Initial administrator account initialized successfully"))
                .andExpect(jsonPath("$.data.username").value("cluster_admin"))
                .andExpect(jsonPath("$.data.email").value("admin@kubemind.io"));

        verify(authService, times(1)).setupInitialAdmin(any(SetupAdminRequest.class));
    }
}
