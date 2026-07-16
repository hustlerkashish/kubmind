package io.kubemind.backend.config;

import io.kubemind.backend.entity.Role;
import io.kubemind.backend.entity.User;
import io.kubemind.backend.repository.RoleRepository;
import io.kubemind.backend.repository.UserRepository;
import io.kubemind.backend.util.AppConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking KubeMind system roles and default seed user...");

        Role adminRole = roleRepository.findByName(AppConstants.ROLE_ADMIN)
                .orElseGet(() -> roleRepository.save(Role.builder().name(AppConstants.ROLE_ADMIN).build()));

        Role devRole = roleRepository.findByName(AppConstants.ROLE_DEVELOPER)
                .orElseGet(() -> roleRepository.save(Role.builder().name(AppConstants.ROLE_DEVELOPER).build()));

        if (!userRepository.existsByUsername("operator") && !userRepository.existsByEmail("operator@kubemind.io")) {
            User defaultOperator = User.builder()
                    .username("operator")
                    .email("operator@kubemind.io")
                    .fullName("SRE Command Operator")
                    .password(passwordEncoder.encode("password123"))
                    .enabled(true)
                    .roles(Set.of(adminRole, devRole))
                    .build();

            userRepository.save(defaultOperator);
            log.info("Default operator account successfully seeded: operator@kubemind.io / password123");
        }
    }
}
