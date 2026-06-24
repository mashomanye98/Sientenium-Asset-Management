/*Hlongwane Sinenhlanhla*/
package com.example.sienteniumassetmanagement.asset;
import com.example.sienteniumassetmanagement.auditlog.AuditLog;
import com.example.sienteniumassetmanagement.auditlog.AuditLogService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AssetService {

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private AuditLogService auditLogService;

    // CREATE
    public AssetResponseDTO createAsset(AssetRequestDTO dto) {
        Asset asset = mapToEntity(dto);
        asset.setStatus(Asset.AssetStatus.AVAILABLE); // default status
        Asset saved = assetRepository.save(asset);

        // Record audit log
        auditLogService.recordAction(
                dto.getCreatedByUserId(),
                AuditLog.EntityType.ASSET,
                saved.getAssetId(),
                AuditLog.Action.CREATE
        );

        return mapToResponse(saved);
    }

    // READ ALL
    public List<AssetResponseDTO> getAllAssets() {
        return assetRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // READ ONE
    public AssetResponseDTO getAssetById(Long id) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));
        return mapToResponse(asset);
    }

    // UPDATE
    public AssetResponseDTO updateAsset(Long id, AssetRequestDTO dto) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));

        asset.setTitle(dto.getTitle());
        asset.setCategory(Asset.AssetCategory.valueOf(dto.getCategory()));
        asset.setSerialNumber(dto.getSerialNumber());
        asset.setAcquisitionDate(dto.getAcquisitionDate());
        asset.setCost(dto.getCost());
        asset.setLocation(dto.getLocation());
        asset.setCondition(Asset.AssetCondition.valueOf(dto.getCondition()));
        asset.setPhotoPath(dto.getPhotoPath());

        /*Thabo*/
        if (dto.getStatus() != null && !dto.getStatus().isEmpty()) {
            asset.setStatus(Asset.AssetStatus.valueOf(dto.getStatus()));
        }

        Asset saved = assetRepository.save(asset);
        // Record audit log
        auditLogService.recordAction(
                dto.getCreatedByUserId(),
                AuditLog.EntityType.ASSET,
                saved.getAssetId(),
                AuditLog.Action.UPDATE
        );

        return mapToResponse(saved);
    }

    // DELETE (retire)
    public void retireAsset(Long id) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));
        asset.setStatus(Asset.AssetStatus.RETIRED);
        assetRepository.save(asset);

        // Record audit log — use a system userId e.g. 1L for now
        auditLogService.recordAction(1L, AuditLog.EntityType.ASSET, id, AuditLog.Action.RETIRE);
    }


    // Mapper helpers
    private Asset mapToEntity(AssetRequestDTO dto) {
        Asset asset = new Asset();
        asset.setTitle(dto.getTitle());
        asset.setCategory(Asset.AssetCategory.valueOf(dto.getCategory().toUpperCase().replace(" ", "_")));
        asset.setSerialNumber(dto.getSerialNumber());
        asset.setAcquisitionDate(dto.getAcquisitionDate());
        asset.setCost(dto.getCost());
        asset.setLocation(dto.getLocation());
        asset.setCondition(Asset.AssetCondition.valueOf(dto.getCondition().toUpperCase()));
        asset.setPhotoPath(dto.getPhotoPath());
        return asset;
    }

    private AssetResponseDTO mapToResponse(Asset asset) {
        AssetResponseDTO dto = new AssetResponseDTO();
        dto.setAssetId(asset.getAssetId());
        dto.setTitle(asset.getTitle());
        dto.setCategory(String.valueOf(asset.getCategory()));
        dto.setSerialNumber(asset.getSerialNumber());
        dto.setAcquisitionDate(asset.getAcquisitionDate());
        dto.setCost(asset.getCost());
        dto.setLocation(asset.getLocation());
        dto.setCondition(String.valueOf(asset.getCondition()));
        dto.setPhotoPath(asset.getPhotoPath());
        dto.setStatus(String.valueOf(asset.getStatus()));
        return dto;
    }
    // SEARCH BY TITLE
    public List<AssetResponseDTO> searchByTitle(String title) {
        return assetRepository.findByTitleContainingIgnoreCase(title)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // SEARCH BY CATEGORY
    public List<AssetResponseDTO> searchByCategory(String category) {
        Asset.AssetCategory assetCategory = Asset.AssetCategory
                .valueOf(category.toUpperCase().replace(" ", "_"));
        return assetRepository.findByCategory(assetCategory)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // SEARCH BY STATUS
    public List<AssetResponseDTO> searchByStatus(String status) {
        Asset.AssetStatus assetStatus = Asset.AssetStatus
                .valueOf(status.toUpperCase());
        return assetRepository.findByStatus(assetStatus)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // FILTER BY LOCATION
    public List<AssetResponseDTO> filterByLocation(String location) {
        return assetRepository.findByLocationContainingIgnoreCase(location)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // FILTER BY CONDITION
    public List<AssetResponseDTO> filterByCondition(String condition) {
        Asset.AssetCondition assetCondition = Asset.AssetCondition
                .valueOf(condition.toUpperCase());
        return assetRepository.findByCondition(assetCondition)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

//    // HARD DELETE - permanently removes the asset from the database
//    public void deleteAsset(Long id) {
//        if (!assetRepository.existsById(id)) {
//            throw new RuntimeException("Asset not found");
//        }
//        assetRepository.deleteById(id);
//    }

    @Transactional
    public AssetResponseDTO updateAssetStatus(Long id, String status) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found with id: " + id));

        Asset.AssetStatus newStatus = Asset.AssetStatus.valueOf(status.toUpperCase());
        asset.setStatus(newStatus);

        Asset updated = assetRepository.save(asset);
        return mapToResponse(updated);
    }

    // Currently loaned assets
//    public List<AssetResponseDTO> getCurrentlyLoanedAssets(Long userId) {
//        return assetRepository.findCurrentlyLoanedAssetsByUser(userId)
//                .stream()
//                .map(this::mapToResponse)
//                .collect(Collectors.toList());
//    }
//
//    // Full loan history
//    public List<AssetResponseDTO> getAllLoanedAssets(Long userId) {
//        return assetRepository.findAllLoanedAssetsByUser(userId)
//                .stream()
//                .map(this::mapToResponse)
//                .collect(Collectors.toList());
//    }

}