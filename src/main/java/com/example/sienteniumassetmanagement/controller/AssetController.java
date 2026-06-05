/*Hlongwane Sinenhlanhla*/
package com.example.sienteniumassetmanagement.controller;
import com.example.sienteniumassetmanagement.dto.*;
import com.example.sienteniumassetmanagement.service.AssetService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/assets")
public class AssetController {

    @Autowired
    private AssetService assetService;

    @PostMapping
    public ResponseEntity<AssetResponseDTO> createAsset(@Valid @RequestBody AssetRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assetService.createAsset(dto));
    }

    @GetMapping
    public ResponseEntity<List<AssetResponseDTO>> getAllAssets() {
        return ResponseEntity.ok(assetService.getAllAssets());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetResponseDTO> getAsset(@PathVariable Long id) {
        return ResponseEntity.ok(assetService.getAssetById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssetResponseDTO> updateAsset(@PathVariable Long id,
                                                        @Valid @RequestBody AssetRequestDTO dto) {
        return ResponseEntity.ok(assetService.updateAsset(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> retireAsset(@PathVariable Long id) {
        assetService.retireAsset(id);
        return ResponseEntity.noContent().build();
    }
}
