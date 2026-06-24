package com.example.sienteniumassetmanagement.asset;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

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

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Asset a where a.assetId = :assetId")
    Optional<Asset> findByIdForUpdate(@Param("assetId") Long assetId);

    // Assets currently on loan to a user (active loans only)
//    @Query("SELECT l.asset FROM Loan l WHERE l.user.userId = :userId AND l.status = 'approved' AND l.returnDate IS NULL")
//    List<Asset> findCurrentlyLoanedAssetsByUser(@Param("userId") Long userId);
//
//    // All assets ever borrowed by a user (full history)
//    @Query("SELECT l.asset FROM Loan l WHERE l.user.userId = :userId")
//    List<Asset> findAllLoanedAssetsByUser(@Param("userId") Long userId);

}
