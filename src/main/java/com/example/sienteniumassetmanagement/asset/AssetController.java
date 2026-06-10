/*Hlongwane Sinenhlanhla*/
package com.example.sienteniumassetmanagement.asset;
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

    // SEARCH

    @GetMapping("/search/title")
// GET /api/assets/search/title?title=laptop
    public ResponseEntity<List<AssetResponseDTO>> searchByTitle(
            @RequestParam String title) {
        return ResponseEntity.ok(assetService.searchByTitle(title));
    }

    @GetMapping("/search/category")
// GET /api/assets/search/category?category=IT_EQUIPMENT
    public ResponseEntity<List<AssetResponseDTO>> searchByCategory(
            @RequestParam String category) {
        return ResponseEntity.ok(assetService.searchByCategory(category));
    }

    @GetMapping("/search/status")
// GET /api/assets/search/status?status=AVAILABLE
    public ResponseEntity<List<AssetResponseDTO>> searchByStatus(
            @RequestParam String status) {
        return ResponseEntity.ok(assetService.searchByStatus(status));
    }

// FILTER

    @GetMapping("/filter/location")
// GET /api/assets/filter/location?location=IT Room
    public ResponseEntity<List<AssetResponseDTO>> filterByLocation(
            @RequestParam String location) {
        return ResponseEntity.ok(assetService.filterByLocation(location));
    }

    @GetMapping("/filter/condition")
// GET /api/assets/filter/condition?condition=GOOD
    public ResponseEntity<List<AssetResponseDTO>> filterByCondition(
            @RequestParam String condition) {
        return ResponseEntity.ok(assetService.filterByCondition(condition));
    }
}
