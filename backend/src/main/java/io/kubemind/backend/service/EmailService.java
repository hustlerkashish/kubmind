package io.kubemind.backend.service;

public interface EmailService {
    /**
     * Dispatches a password reset email to the specified recipient.
     * Implementations must handle delivery securely and avoid logging sensitive tokens or links.
     *
     * @param toEmail   Recipient email address
     * @param resetLink Configured password reset link containing the one-time raw token
     */
    void sendPasswordResetEmail(String toEmail, String resetLink);
}
