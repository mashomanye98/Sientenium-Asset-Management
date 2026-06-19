package com.example.sienteniumassetmanagement.User.repository;

import java.util.List;
import java.util.Optional;

import com.example.sienteniumassetmanagement.User.entity.Role;
import com.example.sienteniumassetmanagement.User.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByEmailAndIdNot(String email, Long id);
    boolean existsByRole(Role role);
    List<User> findByActiveTrue();
}
