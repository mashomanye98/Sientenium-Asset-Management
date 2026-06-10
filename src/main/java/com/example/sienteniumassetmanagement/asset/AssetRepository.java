package com.example.sienteniumassetmanagement.asset;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetRepository extends JpaRepository<Asset, Long> {
    List<Asset> findByTitleContainingOrCategoryContaining(String title, String category);

    List<Asset> findByStatus(String status);

    List<Asset> findByLocation(String location);

    List<Asset> findByCondition(String condition);
    // Search by title (partial match, case insensitive)
    List<Asset> findByTitleContainingIgnoreCase(String title);

    // Search by category
    List<Asset> findByCategory(Asset.AssetCategory category);

    // Search by status
    List<Asset> findByStatus(Asset.AssetStatus status);

    // Filter by location (partial match, case insensitive)
    List<Asset> findByLocationContainingIgnoreCase(String location);

    // Filter by condition
    List<Asset> findByCondition(Asset.AssetCondition condition);

}
