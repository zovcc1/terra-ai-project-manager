package com.terra.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Stub email service. Logs tokens instead of sending real emails.
 * TODO: configure spring.mail.* properties and integrate with an SMTP provider.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    public void sendVerificationEmail(String email, String token) {
        log.info("VERIFICATION EMAIL to {}: token={}", email, token);
    }

    public void sendPasswordResetEmail(String email, String token) {
        log.info("PASSWORD RESET EMAIL to {}: token={}", email, token);
    }
}
