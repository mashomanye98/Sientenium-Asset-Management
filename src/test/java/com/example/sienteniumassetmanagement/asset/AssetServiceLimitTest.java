package com.example.sienteniumassetmanagement.asset;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Transactional
public class AssetServiceLimitTest {

    @Autowired
    private AssetService assetService;

    @Autowired
    private AssetRepository assetRepository;

    @BeforeEach
    void setUp() {
        assetRepository.deleteAll();
    }

    @Test
    void testCreateAsset_EnforcesLimitOfNine() {
        // Create 9 assets
        for (int i = 1; i <= 9; i++) {
            AssetRequestDTO dto = new AssetRequestDTO();
            dto.setTitle("Asset " + i);
            dto.setCategory("IT_EQUIPMENT");
            dto.setSerialNumber("SN-" + i);
            dto.setCondition("NEW");
            dto.setCreatedByUserId(1L);
            assetService.createAsset(dto);
        }

        assertEquals(9, assetRepository.count());

        // Attempt to create the 10th asset
        AssetRequestDTO extraDto = new AssetRequestDTO();
        extraDto.setTitle("Asset 10");
        extraDto.setCategory("IT_EQUIPMENT");
        extraDto.setSerialNumber("SN-10");
        extraDto.setCondition("NEW");
        extraDto.setCreatedByUserId(1L);

        Exception exception = assertThrows(IllegalStateException.class, () -> {
            assetService.createAsset(extraDto);
        });

        assertEquals("Maximum limit of 9 assets reached.", exception.getMessage());
    }
}
