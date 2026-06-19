package com.example.sienteniumassetmanagement.asset;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalStateException(IllegalStateException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

//    // Handles @Valid validation failures — shows field-level messages
//    @ExceptionHandler(MethodArgumentNotValidException.class)
//    public ResponseEntity<Map<String, String>> handleValidationErrors(
//            MethodArgumentNotValidException ex) {
//
//        Map<String, String> errors = new HashMap<>();
//
//        ex.getBindingResult().getFieldErrors().forEach(error ->
//                errors.put(error.getField(), error.getDefaultMessage())
//        );
//
//        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
//    }
////
//    // Handles duplicate serial number and other DB constraint violations
//    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
//    public ResponseEntity<Map<String, String>> handleDuplicateKey(
//            org.springframework.dao.DataIntegrityViolationException ex) {
//
//        Map<String, String> error = new HashMap<>();
//        error.put("error", "Serial number already exists — please use a unique serial number");
//        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
//    }


}