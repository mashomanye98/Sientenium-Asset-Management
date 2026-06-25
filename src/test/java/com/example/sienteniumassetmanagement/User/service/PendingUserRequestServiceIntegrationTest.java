package com.example.sienteniumassetmanagement.User.service;

import com.example.sienteniumassetmanagement.User.dto.RegisterRequest;
import com.example.sienteniumassetmanagement.User.repository.PendingUserRequestRepository;
import com.example.sienteniumassetmanagement.User.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Transactional
public class PendingUserRequestServiceIntegrationTest {

    @Autowired
    private PendingUserRequestService pendingUserRequestService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PendingUserRequestRepository pendingUserRequestRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        pendingUserRequestRepository.deleteAll();
    }

    @Test
    void testCreateRequest_ShouldNotThrow_WhenEmailIsNew() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("John Doe");
        request.setEmail("john.doe@example.com");
        request.setPassword("password123");
        request.setDepartment("IT");

        assertDoesNotThrow(() -> pendingUserRequestService.createRequest(request));
    }

    @Test
    void testCreateRequest_ShouldThrow_WhenEmailAlreadyInUserTable() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("John Doe");
        request.setEmail("john.doe@example.com");
        request.setPassword("password123");
        request.setDepartment("IT");

        pendingUserRequestService.createRequest(request);

        RegisterRequest duplicateRequest = new RegisterRequest();
        duplicateRequest.setFullName("Jane Doe");
        duplicateRequest.setEmail("john.doe@example.com");
        duplicateRequest.setPassword("password456");
        duplicateRequest.setDepartment("HR");

        assertThrows(IllegalArgumentException.class, () -> pendingUserRequestService.createRequest(duplicateRequest));
    }

    @Test
    void testCreateRequest_ShouldHandleWhitespace() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("John Doe");
        request.setEmail(" john.doe@example.com ");
        request.setPassword("password123");
        request.setDepartment("IT");

        // If it throws here, it means it thinks it exists already, which is what the user reports.
        // But in a clean DB it should NOT exist.
        assertDoesNotThrow(() -> pendingUserRequestService.createRequest(request));
        
        RegisterRequest duplicateRequest = new RegisterRequest();
        duplicateRequest.setFullName("Jane Doe");
        duplicateRequest.setEmail("john.doe@example.com");
        duplicateRequest.setPassword("password456");
        duplicateRequest.setDepartment("HR");

        // This SHOULD throw if the first one was saved correctly.
        assertThrows(IllegalArgumentException.class, () -> pendingUserRequestService.createRequest(duplicateRequest));
    }
}
