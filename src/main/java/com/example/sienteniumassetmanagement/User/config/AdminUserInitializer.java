package com.example.sienteniumassetmanagement.User.config;

import com.example.sienteniumassetmanagement.User.entity.Role;
import com.example.sienteniumassetmanagement.User.entity.User;
import com.example.sienteniumassetmanagement.User.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminUserInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(AdminUserInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String defaultAdminEmail;
    private final String defaultAdminPassword;
    private final String defaultAdminFullName;
    private final String defaultAdminDepartment;
    private final String secondaryAdminEmail;
    private final String secondaryAdminPassword;
    private final String secondaryAdminFullName;
    private final String secondaryAdminDepartment;

    public AdminUserInitializer(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.default.admin.email:admin@sientenium.com}") String defaultAdminEmail,
            @Value("${app.default.admin.password:Sientenium@2026#Admin9}") String defaultAdminPassword,
            @Value("${app.default.admin.full-name:System Administrator}") String defaultAdminFullName,
            @Value("${app.default.admin.department:Administration}") String defaultAdminDepartment,
            @Value("${app.secondary.admin.email:johannes.smith@sientenium.com}") String secondaryAdminEmail,
            @Value("${app.secondary.admin.password:Johannes@2026#Admin7}") String secondaryAdminPassword,
            @Value("${app.secondary.admin.full-name:Johannes Smith}") String secondaryAdminFullName,
            @Value("${app.secondary.admin.department:Administration}") String secondaryAdminDepartment) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.defaultAdminEmail = defaultAdminEmail;
        this.defaultAdminPassword = defaultAdminPassword;
        this.defaultAdminFullName = defaultAdminFullName;
        this.defaultAdminDepartment = defaultAdminDepartment;
        this.secondaryAdminEmail = secondaryAdminEmail;
        this.secondaryAdminPassword = secondaryAdminPassword;
        this.secondaryAdminFullName = secondaryAdminFullName;
        this.secondaryAdminDepartment = secondaryAdminDepartment;
    }

    @Override
    public void run(String... args) {
        ensureAdminUser(defaultAdminEmail, defaultAdminFullName, defaultAdminPassword, defaultAdminDepartment, "default");
        ensureAdminUser(secondaryAdminEmail, secondaryAdminFullName, secondaryAdminPassword, secondaryAdminDepartment, "secondary");
    }

    private void ensureAdminUser(String email, String fullName, String password, String department, String label) {
        userRepository.findByEmail(email).ifPresentOrElse(
            existingAdmin -> {
                existingAdmin.setFullName(fullName);
                existingAdmin.setPassword(passwordEncoder.encode(password));
                existingAdmin.setDepartment(department);
                existingAdmin.setRole(Role.ROLE_ADMIN);
                existingAdmin.setActive(true);
                userRepository.save(existingAdmin);
                logger.info("{} admin user updated: {}", label, email);
            },
            () -> {
                User admin = new User();
                admin.setFullName(fullName);
                admin.setEmail(email);
                admin.setPassword(passwordEncoder.encode(password));
                admin.setDepartment(department);
                admin.setRole(Role.ROLE_ADMIN);
                admin.setActive(true);
                userRepository.save(admin);
                logger.info("{} admin user created: {}", label, email);
            }
        );
    }
}
