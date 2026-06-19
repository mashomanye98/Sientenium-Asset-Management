package com.example.sienteniumassetmanagement.User.repository;

import java.util.List;
import java.util.Optional;

import com.example.sienteniumassetmanagement.User.entity.PendingUserRequest;
import com.example.sienteniumassetmanagement.User.entity.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PendingUserRequestRepository extends JpaRepository<PendingUserRequest, Long> {
    List<PendingUserRequest> findByStatus(RequestStatus status);
    boolean existsByEmail(String email);
    Optional<PendingUserRequest> findByEmail(String email);
}
