package com.example.sienteniumassetmanagement.User.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:admin.sientenium@gmail.com}")
    private String mailFrom;

    private final String loginUrl = "http://localhost:8082/signIn.html";
    private final String resetPasswordUrl = "http://localhost:8082/reset-password.html?token=";

    /**
     * This sends a special email to the user with a link they can click to reset their password.
     * It's like a temporary key to get back into their account!
     */
    public void sendPasswordResetEmail(String recipientEmail, String fullName, String token) {
        try {
            // We create a fresh email message here
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            // Setting up who it's from and where it's going
            helper.setFrom(mailFrom);
            helper.setTo(recipientEmail);
            helper.setSubject("Reset Your Sientenium Password");

            // We build the full link by adding the secret token to our reset URL
            String fullResetLink = resetPasswordUrl + token;

            // Now we stick that link into our nice HTML template
            helper.setText(buildPasswordResetTemplate(fullName, fullResetLink), true);

            helper.addInline(
                "logo",
                new ClassPathResource(
                    "static/images/email-logo.png"
                )
            );

            // And off it goes!
            mailSender.send(message);
        } catch (Exception e) {
            // If something goes wrong, we'll know about it
            throw new RuntimeException("Oops! Failed to send the password reset email.", e);
        }
    }

    public void sendApprovalEmail(String recipientEmail, String fullName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailFrom);
            helper.setTo(recipientEmail);
            helper.setSubject("Your Sientenium Account Has Been Approved");
            helper.setText(buildApprovalTemplate(fullName), true);

            helper.addInline(
                "logo",
                new ClassPathResource(
                    "static/images/email-logo.png"
                )
            );

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email due to messaging error", e);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }

    public void sendRegistrationReceivedEmail(String recipientEmail, String fullName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailFrom);
            helper.setTo(recipientEmail);
            helper.setSubject("Sientenium Registration Received - Awaiting Approval");
            helper.setText(buildRegistrationReceivedTemplate(fullName), true);

            helper.addInline(
                "logo",
                new ClassPathResource(
                    "static/images/email-logo.png"
                )
            );

            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send registration received email", e);
        }
    }

    public void sendRejectionEmail(String recipientEmail, String fullName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailFrom);
            helper.setTo(recipientEmail);
            helper.setSubject("Update Regarding Your Sientenium Account Request");
            helper.setText(buildRejectionTemplate(fullName), true);

            helper.addInline(
                "logo",
                new ClassPathResource(
                    "static/images/email-logo.png"
                )
            );

            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send rejection email", e);
        }
    }

    private String buildApprovalTemplate(String fullName) {
        return """
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Account Approved</title>
</head>

<body style="
    margin:0;
    padding:0;
    background:#f4f6f8;
    font-family:Arial,sans-serif;
">

<table width="100%%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">

<table width="650" cellpadding="0" cellspacing="0"
style="
    background:white;
    margin-top:30px;
    border-radius:10px;
    overflow:hidden;
">

<tr>
<td align="center"
style="
    background:#0f172a;
    padding:30px;
">

<img src="cid:logo"
     width="600"
     height="220"
     alt="Sientenium Logo">


</td>
</tr>

<tr>
<td style="
    background:#16a34a;
    color:white;
    text-align:center;
    padding:20px;
">

<h2 style="margin:0;">
✓ Account Successfully Approved
</h2>

</td>
</tr>

<tr>
<td style="padding:40px;">

<h2>
Dear %s,
</h2>

<p style="
    font-size:16px;
    line-height:1.8;
">
We are pleased to inform you that your
Sientenium Asset Management account
has been approved by the system
administrator.
</p>

<p style="
    font-size:16px;
    line-height:1.8;
">
You may now sign in and begin
requesting company assets through
the platform.
</p>

<div style="
    text-align:center;
    margin-top:35px;
    margin-bottom:35px;
">

<a href="%s"
   style="
   background:#16a34a;
   color:white;
   padding:15px 30px;
   text-decoration:none;
   border-radius:6px;
   font-weight:bold;
   ">
   Login
</a>

</div>

<hr>

<p style="font-size:15px;">
Regards,
</p>

<p style="font-size:15px;">
<strong>
Snenhlanhla Hlongwane
</strong>
<br>
Sientenium Administrator
</p>

</td>
</tr>

<tr>
<td
style="
background:#f1f5f9;
padding:20px;
text-align:center;
font-size:12px;
color:#64748b;
">

© 2026 Sientenium Asset Management System

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
""".formatted(fullName, loginUrl);
    }
    private String buildRegistrationReceivedTemplate(String fullName) {
        return """
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Registration Received</title>
</head>

<body style="
    margin:0;
    padding:0;
    background:#f4f6f8;
    font-family:Arial,sans-serif;
">

<table width="100%%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">

<table width="650" cellpadding="0" cellspacing="0"
style="
    background:white;
    margin-top:30px;
    border-radius:10px;
    overflow:hidden;
">

<tr>
<td align="center"
style="
    background:#0f172a;
    padding:30px;
">

<img src="cid:logo"
     width="600"
     height="220"
     alt="Sientenium Logo">

</td>
</tr>

<tr>
<td style="
    background:#3b82f6;
    color:white;
    text-align:center;
    padding:20px;
">

<h2 style="margin:0;">
Registration Received
</h2>

</td>
</tr>

<tr>
<td style="padding:40px;">

<h2>
Hello %s,
</h2>

<p style="
    font-size:16px;
    line-height:1.8;
">
Thank you for registering with the 
<strong>Sientenium Asset Management System</strong>.
</p>

<p style="
    font-size:16px;
    line-height:1.8;
">
Your account request has been successfully 
received and is currently <strong>awaiting approval</strong> 
by a system administrator.
</p>

<p style="
    font-size:16px;
    line-height:1.8;
">
Once your account is approved, you will receive another 
email letting you know that you can sign in.
</p>

<hr>

<p style="font-size:15px;">
Regards,
</p>

<p style="font-size:15px;">
<strong>
Snenhlanhla Hlongwane
</strong>
<br>
Sientenium Administrator
</p>

</td>
</tr>

<tr>
<td
style="
background:#f1f5f9;
padding:20px;
text-align:center;
font-size:12px;
color:#64748b;
">

© 2026 Sientenium Asset Management System

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
""".formatted(fullName);
    }

    private String buildRejectionTemplate(String fullName) {
        return """
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Account Request Update</title>
</head>

<body style="
    margin:0;
    padding:0;
    background:#f4f6f8;
    font-family:Arial,sans-serif;
">

<table width="100%%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">

<table width="650" cellpadding="0" cellspacing="0"
style="
    background:white;
    margin-top:30px;
    border-radius:10px;
    overflow:hidden;
">

<tr>
<td align="center"
style="
    background:#0f172a;
    padding:30px;
">

<img src="cid:logo"
     width="600"
     height="220"
     alt="Sientenium Logo">

</td>
</tr>

<tr>
<td style="
    background:#ef4444;
    color:white;
    text-align:center;
    padding:20px;
">

<h2 style="margin:0;">
Account Request Update
</h2>

</td>
</tr>

<tr>
<td style="padding:40px;">

<h2>
Dear %s,
</h2>

<p style="
    font-size:16px;
    line-height:1.8;
">
Thank you for your interest in the 
Sientenium Asset Management System.
</p>

<p style="
    font-size:16px;
    line-height:1.8;
">
After careful review, we regret to inform you 
that your account registration request could not 
be approved due to more than 2 assets returned with poor conditions.
</p>

<p style="
    font-size:16px;
    line-height:1.8;
">
If you believe this is a mistake or have any 
questions, please contact your department 
head or the IT administrator.
</p>

<hr>

<p style="font-size:15px;">
Regards,
</p>

<p style="font-size:15px;">
<strong>
Snenhlanhla Hlongwane
</strong>
<br>
Sientenium Administrator
</p>

</td>
</tr>

<tr>
<td
style="
background:#f1f5f9;
padding:20px;
text-align:center;
font-size:12px;
color:#64748b;
">

© 2026 Sientenium Asset Management System

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
""".formatted(fullName);
    }

    private String buildPasswordResetTemplate(String fullName, String resetLink) {
        return """
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Reset Your Password</title>
</head>

<body style="
    margin:0;
    padding:0;
    background:#f4f6f8;
    font-family:Arial,sans-serif;
">

<table width="100%%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">

<table width="650" cellpadding="0" cellspacing="0"
style="
    background:white;
    margin-top:30px;
    border-radius:10px;
    overflow:hidden;
">

<tr>
<td align="center"
style="
    background:#0f172a;
    padding:30px;
">
<img src="cid:logo"
     width="600"
     height="220"
     alt="Sientenium Logo">
</td>
</tr>

<tr>
<td style="
    background:#6366f1;
    color:white;
    text-align:center;
    padding:20px;
">

<h2 style="margin:0;">
Password Reset Request
</h2>

</td>
</tr>

<tr>
<td style="padding:40px;">

<h2>
Hi %s,
</h2>

<p style="
    font-size:16px;
    line-height:1.8;
">
We received a request to reset the password for your 
<strong>Sientenium Asset Management</strong> account. 
No worries, it happens to the best of us!
</p>

<p style="
    font-size:16px;
    line-height:1.8;
">
Just click the button below to choose a new password. 
This link will stay active for the next 24 hours.
</p>

<div style="
    text-align:center;
    margin-top:35px;
    margin-bottom:35px;
">

<a href="%s"
   style="
   background:#6366f1;
   color:white;
   padding:15px 30px;
   text-decoration:none;
   border-radius:6px;
   font-weight:bold;
   ">
   Reset My Password
</a>

</div>

<p style="
    font-size:14px;
    color: #64748b;
">
If you didn't ask to reset your password, you can just 
ignore this email. Your account is still safe!
</p>

<hr>

<p style="font-size:15px;">
Regards,
</p>

<p style="font-size:15px;">
<strong>
Snenhlanhla Hlongwane
</strong>
<br>
Sientenium Administrator
</p>

</td>
</tr>

<tr>
<td
style="
background:#f1f5f9;
padding:20px;
text-align:center;
font-size:12px;
color:#64748b;
">

© 2026 Sientenium Asset Management System

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
""".formatted(fullName, resetLink);
    }
}
