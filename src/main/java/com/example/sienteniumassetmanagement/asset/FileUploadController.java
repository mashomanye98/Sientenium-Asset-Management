package com.example.sienteniumassetmanagement.asset;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class FileUploadController {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @PostMapping("/photo")
    public ResponseEntity<?> uploadPhoto(@RequestParam("file") MultipartFile file) {

        try {
            // Generate a unique filename so two files never clash
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String newFilename = UUID.randomUUID().toString() + extension;

            // Create the uploads directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Save the file to the uploads folder
            Path filePath = uploadPath.resolve(newFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Return the path to store in the database
            String photoPath = "/uploads/" + newFilename;
            return ResponseEntity.ok(Map.of(
                    "photoPath", photoPath,
                    "message", "File uploaded successfully"
            ));

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        }
    }
}