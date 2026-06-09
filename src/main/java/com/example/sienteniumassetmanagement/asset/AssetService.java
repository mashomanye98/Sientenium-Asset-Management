/*Hlongwane Sinenhlanhla*/
package com.example.sienteniumassetmanagement.asset;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AssetService {

    @Autowired
    private AssetRepository assetRepository;

    // CREATE
    public AssetResponseDTO createAsset(AssetRequestDTO dto) {
        Asset asset = mapToEntity(dto);
        asset.setStatus(Asset.AssetStatus.valueOf("available")); // default status
        Asset saved = assetRepository.save(asset);
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

        return mapToResponse(assetRepository.save(asset));
    }

    // DELETE (retire)
    public void retireAsset(Long id) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Asset not found"));
        asset.setStatus(Asset.AssetStatus.valueOf("retired"));
        assetRepository.save(asset);
    }

    // Mapper helpers
    private Asset mapToEntity(AssetRequestDTO dto) {
        Asset asset = new Asset();
        asset.setTitle(dto.getTitle());
        asset.setCategory(Asset.AssetCategory.valueOf(dto.getCategory()));
        asset.setSerialNumber(dto.getSerialNumber());
        asset.setAcquisitionDate(dto.getAcquisitionDate());
        asset.setCost(dto.getCost());
        asset.setLocation(dto.getLocation());
        asset.setCondition(Asset.AssetCondition.valueOf(dto.getCondition()));
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
}