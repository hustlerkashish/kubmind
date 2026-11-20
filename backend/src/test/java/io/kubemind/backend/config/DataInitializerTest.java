package io.kubemind.backend.config;

import io.kubemind.backend.entity.Role;
import io.kubemind.backend.entity.User;
import io.kubemind.backend.repository.RoleRepository;
import io.kubemind.backend.repository.UserRepository;
import io.kubemind.backend.util.AppConstants;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DataInitializerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private DataInitializer dataInitializer;

    private Role adminRole;
    private Role devRole;

    @BeforeEach
    void setUp() {
        adminRole = Role.builder().name(AppConstants.ROLE_ADMIN).build();
        devRole = Role.builder().name(AppConstants.ROLE_DEVELOPER).build();

        when(roleRepository.findByName(AppConstants.ROLE_ADMIN)).thenReturn(Optional.of(adminRole));
        when(roleRepository.findByName(AppConstants.ROLE_DEVELOPER)).thenReturn(Optional.of(devRole));
    }

    @Test
    @DisplayName("No hardcoded administrator is created when environment variables are omitted")
    void run_WithoutEnvironmentCredentials_DoesNotCreateAdministrator() {
        ReflectionTestUtils.setField(dataInitializer, "initialAdminUsername", "");
        ReflectionTestUtils.setField(dataInitializer, "initialAdminEmail", "");
        ReflectionTestUtils.setField(dataInitializer, "initialAdminPassword", "");

        when(userRepository.existsByRoles_Name(AppConstants.ROLE_ADMIN)).thenReturn(false);

        dataInitializer.run();

        // Must verify no user is saved silently
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Initial administrator is provisioned when valid environment credentials are provided")
    void run_WithEnvironmentCredentials_ProvisionsAdministrator() {
        ReflectionTestUtils.setField(dataInitializer, "initialAdminUsername", "lead_admin");
        ReflectionTestUtils.setField(dataInitializer, "initialAdminEmail", "admin@kubemind.io");
        ReflectionTestUtils.setField(dataInitializer, "initialAdminPassword", "InitialAdminSecret2026!");

        when(userRepository.existsByRoles_Name(AppConstants.ROLE_ADMIN)).thenReturn(false);
        when(userRepository.existsByUsername("lead_admin")).thenReturn(false);
        when(userRepository.existsByEmail("admin@kubemind.io")).thenReturn(false);
        when(passwordEncoder.encode("InitialAdminSecret2026!")).thenReturn("encoded_admin_password_hash");

        dataInitializer.run();

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(userCaptor.capture());

        User createdAdmin = userCaptor.getValue();
        assertThat(createdAdmin.getUsername()).isEqualTo("lead_admin");
        assertThat(createdAdmin.getEmail()).isEqualTo("admin@kubemind.io");
        assertThat(createdAdmin.getPassword()).isEqualTo("encoded_admin_password_hash");
        assertThat(createdAdmin.getPassword()).isNotEqualTo("InitialAdminSecret2026!");
        assertThat(createdAdmin.getRoles()).contains(adminRole, devRole);
    }

    @Test
    @DisplayName("Repeated startup does not re-create or overwrite administrator if one already exists")
    void run_WhenAdministratorAlreadyExists_SkipsCreation() {
        ReflectionTestUtils.setField(dataInitializer, "initialAdminUsername", "lead_admin");
        ReflectionTestUtils.setField(dataInitializer, "initialAdminEmail", "admin@kubemind.io");
        ReflectionTestUtils.setField(dataInitializer, "initialAdminPassword", "InitialAdminSecret2026!");

        when(userRepository.existsByRoles_Name(AppConstants.ROLE_ADMIN)).thenReturn(true);

        dataInitializer.run();

        // Existing admin present; must not save any user
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Verify legacy hardcoded credentials 'operator' / 'password123' are never saved or seeded")
    void run_NeverCreatesHardcodedOperatorAccount() {
        ReflectionTestUtils.setField(dataInitializer, "initialAdminUsername", "");
        ReflectionTestUtils.setField(dataInitializer, "initialAdminEmail", "");
        ReflectionTestUtils.setField(dataInitializer, "initialAdminPassword", "");

        when(userRepository.existsByRoles_Name(AppConstants.ROLE_ADMIN)).thenReturn(false);

        dataInitializer.run();

        verify(userRepository, never()).save(argThat(user -> "operator".equals(user.getUsername())));
        verify(passwordEncoder, never()).encode("password123");
    }
}
