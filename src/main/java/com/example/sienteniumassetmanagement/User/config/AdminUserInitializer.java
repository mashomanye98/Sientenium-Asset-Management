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

    public AdminUserInitializer(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.default.admin.email:admin@sientenium.com}") String defaultAdminEmail,
            @Value("${app.default.admin.password:Admin@123}") String defaultAdminPassword,
            @Value("${app.default.admin.full-name:System Administrator}") String defaultAdminFullName,
            @Value("${app.default.admin.department:Administration}") String defaultAdminDepartment) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.defaultAdminEmail = defaultAdminEmail;
        this.defaultAdminPassword = defaultAdminPassword;
        this.defaultAdminFullName = defaultAdminFullName;
        this.defaultAdminDepartment = defaultAdminDepartment;
    }

    @Override
    public void run(String... args) {
        userRepository.findByEmail(defaultAdminEmail).ifPresentOrElse(
            existingAdmin -> {
                existingAdmin.setPassword(passwordEncoder.encode(defaultAdminPassword));
                existingAdmin.setRole(Role.ROLE_ADMIN);
                existingAdmin.setActive(true);
                userRepository.save(existingAdmin);
                logger.info("Admin user updated with default credentials: {}", defaultAdminEmail);
            },
            () -> {
                User admin = new User();
                admin.setFullName(defaultAdminFullName);
                admin.setEmail(defaultAdminEmail);
                admin.setPassword(passwordEncoder.encode(defaultAdminPassword));
                admin.setDepartment(defaultAdminDepartment);
                admin.setRole(Role.ROLE_ADMIN);
                admin.setActive(true);
                userRepository.save(admin);
                logger.info("Default admin user created: {}", defaultAdminEmail);
            }
        );
    }
}
