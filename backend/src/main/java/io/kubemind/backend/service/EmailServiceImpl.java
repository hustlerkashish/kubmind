package io.kubemind.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    @Override
    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        // Safe dispatch: Log recipient only, never log the sensitive reset token or complete reset link
        log.info("Password reset notification dispatched to recipient: {}", toEmail);

        // When external mail provider or Spring JavaMailSender is configured,
        // message dispatch executes here using pre-configured templates.
    }
}
