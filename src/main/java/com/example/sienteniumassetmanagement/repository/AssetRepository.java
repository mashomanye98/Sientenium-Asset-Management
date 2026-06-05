package com.example.sienteniumassetmanagement.repository;

import com.example.sienteniumassetmanagement.model.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssetRepository extends JpaRepository<Asset, Long> {
    List<Asset> findByTitleContainingOrCategoryContaining(String title, String category);

    List<Asset> findByStatus(String status);

    List<Asset> findByLocation(String location);

    List<Asset> findByCondition(String condition);

}
