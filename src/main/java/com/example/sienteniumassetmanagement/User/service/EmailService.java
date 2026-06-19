//package com.example.sienteniumassetmanagement.User.service;
//
//import com.example.sienteniumassetmanagement.User.entity.User;
//import com.sun.xml.messaging.saaj.packaging.mime.MessagingException;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.stereotype.Service;
//import org.springframework.ws.mime.MimeMessage;
//
///**
// * Responsible for sending transactional email notifications.
// *
// * This service is used when a pending user request is approved and the user
// * should receive an activation notification with login instructions.
// */
//@Service
//public class EmailService {
//
//    private final JavaMailSender mailSender;
//    private final String mailFrom;
//
//    public EmailService(JavaMailSender mailSender,
//                        @Value("${spring.mail.from:no-reply@sientenium.com}") String mailFrom) {
//        this.mailSender = mailSender;
//        this.mailFrom = mailFrom;
//    }
//
//    /**
//     * Send the account activation email to the approved user.
//     *
//     * @param user approved user who should receive the activation message
//     */
//    public void sendAccountActivationEmail(User user) {
//        MimeMessage message = mailSender.createMimeMessage();
//
//        try {
//            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
//            helper.setFrom(mailFrom);
//            helper.setTo(user.getEmail());
//            helper.setSubject("Your Sientenium account is activated");
//            helper.setText(buildActivationMessage(user), true);
//
//            mailSender.send(message);
//        } catch (MessagingException exception) {
//            throw new IllegalStateException("Failed to send activation email", exception);
//        }
//    }
//
//    private String buildActivationMessage(User user) {
//        return "<html>"
//                + "<body style=\"font-family: Arial, sans-serif; color:#333; line-height:1.5;\">"
//                + "<h2 style=\"color:#0a4f8f;\">Sientenium Account Activated</h2>"
//                + "<p>Dear " + escapeHtml(user.getFullName()) + ",</p>"
//                + "<p>Your account has been approved and activated by the Sientenium administrator.</p>"
//                + "<p>You may now sign in to the asset management system with the email address you registered.</p>"
//                + "<p><strong>Role:</strong> " + user.getRole().name().replace("ROLE_", "") + "</p>"
//                + "<p>From the dashboard you will be able to request assets, track loans, and manage your assigned resources.</p>"
//                + "<p>Thank you for joining Sientenium.</p>"
//                + "<p style=\"margin-top:24px; color:#666;\">Sientenium Asset Management Team</p>"
//                + "</body>"
//                + "</html>";
//    }
//
//    private String escapeHtml(String value) {
//        if (value == null) {
//            return "";
//        }
//        return value.replace("&", "&amp;")
//                .replace("<", "&lt;")
//                .replace(">", "&gt;")
//                .replace("\"", "&quot;")
//                .replace("'", "&#39;");
//    }
//}
