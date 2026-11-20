package io.kubemind.backend.config;

import io.kubemind.backend.entity.Role;
import io.kubemind.backend.entity.User;
import io.kubemind.backend.repository.RoleRepository;
import io.kubemind.backend.repository.UserRepository;
import io.kubemind.backend.util.AppConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.initial-admin.username:}")
    private String initialAdminUsername;

    @Value("${app.initial-admin.email:}")
    private String initialAdminEmail;

    @Value("${app.initial-admin.password:}")
    private String initialAdminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking KubeMind system roles and initialization status...");

        Role adminRole = roleRepository.findByName(AppConstants.ROLE_ADMIN)
                .orElseGet(() -> roleRepository.save(Role.builder().name(AppConstants.ROLE_ADMIN).build()));

        Role devRole = roleRepository.findByName(AppConstants.ROLE_DEVELOPER)
                .orElseGet(() -> roleRepository.save(Role.builder().name(AppConstants.ROLE_DEVELOPER).build()));

        boolean adminExists = userRepository.existsByRoles_Name(AppConstants.ROLE_ADMIN);

        if (adminExists) {
            log.info("System initialization check complete: System roles verified and administrator account exists.");
            return;
        }

        boolean hasEnvCredentials = StringUtils.hasText(initialAdminUsername)
                && StringUtils.hasText(initialAdminEmail)
                && StringUtils.hasText(initialAdminPassword);

        if (hasEnvCredentials) {
            if (userRepository.existsByUsername(initialAdminUsername.trim())
                    || userRepository.existsByEmail(initialAdminEmail.trim())) {
                log.warn("Cannot initialize administrator: Username or email from environment is already registered.");
                return;
            }

            User initialAdmin = User.builder()
                    .username(initialAdminUsername.trim())
                    .email(initialAdminEmail.trim())
                    .fullName("Initial System Administrator")
                    .password(passwordEncoder.encode(initialAdminPassword))
                    .enabled(true)
                    .roles(Set.of(adminRole, devRole))
                    .build();

            userRepository.save(initialAdmin);
            log.info("Initial administrator account successfully provisioned from environment for username: {}", initialAdmin.getUsername());
        } else {
            log.info("System roles verified. No administrator account present. Use /auth/setup-admin with KUBEMIND_SETUP_TOKEN to initialize an administrator.");
        }
    }
}
