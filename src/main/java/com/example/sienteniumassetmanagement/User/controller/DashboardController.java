package com.sientenium.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class DashboardController {

    @GetMapping("/admin/dashboard")
    public ResponseEntity<String> adminDashboard() {
        return ResponseEntity.ok("Admin dashboard access granted");
    }

    @GetMapping("/manager/dashboard")
    public ResponseEntity<String> managerDashboard() {
        return ResponseEntity.ok("Manager dashboard access granted");
    }

    @GetMapping("/staff/dashboard")
    public ResponseEntity<String> staffDashboard() {
        return ResponseEntity.ok("Staff dashboard access granted");
    }
}
