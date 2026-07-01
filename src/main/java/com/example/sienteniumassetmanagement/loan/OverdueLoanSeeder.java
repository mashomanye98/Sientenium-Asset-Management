package com.example.sienteniumassetmanagement.loan;

import com.example.sienteniumassetmanagement.User.entity.Role;
import com.example.sienteniumassetmanagement.User.entity.User;
import com.example.sienteniumassetmanagement.User.repository.UserRepository;
import com.example.sienteniumassetmanagement.asset.Asset;
import com.example.sienteniumassetmanagement.asset.AssetRepository;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class OverdueLoanSeeder implements CommandLineRunner {

    private static final LocalDate SEED_REQUEST_DATE = LocalDate.of(2026, 6, 10);
    private static final LocalDate SEED_CHECKOUT_DATE = LocalDate.of(2026, 6, 10);
    private static final LocalDate SEED_DUE_DATE_ONE = LocalDate.of(2026, 6, 24);
    private static final LocalDate SEED_DUE_DATE_TWO = LocalDate.of(2026, 6, 26);

    private final UserRepository userRepository;
    private final AssetRepository assetRepository;
    private final LoanRepository loanRepository;
    private final PasswordEncoder passwordEncoder;

    private final String user1FullName;
    private final String user1Email;
    private final String user1Password;
    private final String user1Department;
    private final String user2FullName;
    private final String user2Email;
    private final String user2Password;
    private final String user2Department;
    private final String asset1Title;
    private final String asset1Serial;
    private final String asset2Title;
    private final String asset2Serial;

    public OverdueLoanSeeder(
            UserRepository userRepository,
            AssetRepository assetRepository,
            LoanRepository loanRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.seed.overdue.user1.full-name:Mashomanye Masemola}") String user1FullName,
            @Value("${app.seed.overdue.user1.email:mashomanye.masemola@sientenium.com}") String user1Email,
            @Value("${app.seed.overdue.user1.password:Mashomanye@2026#Staff1}") String user1Password,
            @Value("${app.seed.overdue.user1.department:Operations}") String user1Department,
            @Value("${app.seed.overdue.user2.full-name:Sinenhlanhla Zikhali}") String user2FullName,
            @Value("${app.seed.overdue.user2.email:sinenhlanhla.zikhali@sientenium.com}") String user2Email,
            @Value("${app.seed.overdue.user2.password:Sinenhlanhla@2026#Staff2}") String user2Password,
            @Value("${app.seed.overdue.user2.department:Operations}") String user2Department,
            @Value("${app.seed.overdue.asset1.title:Dell Latitude 5420}") String asset1Title,
            @Value("${app.seed.overdue.asset1.serial:OVD-ASSET-001}") String asset1Serial,
            @Value("${app.seed.overdue.asset2.title:HP EliteBook 840 G8}") String asset2Title,
            @Value("${app.seed.overdue.asset2.serial:OVD-ASSET-002}") String asset2Serial) {
        this.userRepository = userRepository;
        this.assetRepository = assetRepository;
        this.loanRepository = loanRepository;
        this.passwordEncoder = passwordEncoder;
        this.user1FullName = user1FullName;
        this.user1Email = user1Email;
        this.user1Password = user1Password;
        this.user1Department = user1Department;
        this.user2FullName = user2FullName;
        this.user2Email = user2Email;
        this.user2Password = user2Password;
        this.user2Department = user2Department;
        this.asset1Title = asset1Title;
        this.asset1Serial = asset1Serial;
        this.asset2Title = asset2Title;
        this.asset2Serial = asset2Serial;
    }

    @Override
    public void run(String... args) {
        User userOne = ensureUser(user1FullName, user1Email, user1Password, user1Department);
        User userTwo = ensureUser(user2FullName, user2Email, user2Password, user2Department);

        Asset assetOne = ensureAsset(asset1Title, asset1Serial, "IT Equipment");
        Asset assetTwo = ensureAsset(asset2Title, asset2Serial, "IT Equipment");

        ensureOverdueLoan(userOne, assetOne, SEED_DUE_DATE_ONE);
        ensureOverdueLoan(userTwo, assetTwo, SEED_DUE_DATE_TWO);
    }

    private User ensureUser(String fullName, String email, String rawPassword, String department) {
        Optional<User> existing = userRepository.findAll().stream()
                .filter(user -> fullName.equalsIgnoreCase(user.getFullName())
                        || email.equalsIgnoreCase(user.getEmail()))
                .findFirst();

        if (existing.isPresent()) {
            return existing.get();
        }

        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setDepartment(department);
        user.setRole(Role.ROLE_STAFF);
        user.setActive(true);
        return userRepository.save(user);
    }

    private Asset ensureAsset(String title, String serialNumber, String departmentHint) {
        Optional<Asset> existing = assetRepository.findAll().stream()
                .filter(asset -> serialNumber.equalsIgnoreCase(asset.getSerialNumber()))
                .findFirst();

        if (existing.isPresent()) {
            Asset asset = existing.get();
            if (asset.getStatus() != Asset.AssetStatus.LOANED) {
                asset.setStatus(Asset.AssetStatus.LOANED);
                assetRepository.save(asset);
            }
            return asset;
        }

        Asset asset = new Asset();
        asset.setTitle(title);
        asset.setCategory(Asset.AssetCategory.IT_EQUIPMENT);
        asset.setSerialNumber(serialNumber);
        asset.setLocation(departmentHint);
        asset.setCondition(Asset.AssetCondition.GOOD);
        asset.setStatus(Asset.AssetStatus.LOANED);
        return assetRepository.save(asset);
    }

    private void ensureOverdueLoan(User user, Asset asset, LocalDate dueDate) {
        boolean exists = loanRepository.findAll().stream()
                .anyMatch(loan -> loan.getUserId().equals(user.getId())
                        && loan.getAssetId().equals(asset.getAssetId())
                        && loan.getDueDate() != null
                        && loan.getDueDate().equals(dueDate)
                        && loan.getStatus() == Loan.LoanStatus.APPROVED
                        && loan.getReturnDate() == null);

        if (exists) {
            return;
        }

        Loan loan = new Loan();
        loan.setAssetId(asset.getAssetId());
        loan.setUserId(user.getId());
        loan.setRequestDate(SEED_REQUEST_DATE);
        loan.setStatus(Loan.LoanStatus.APPROVED);
        loan.setCheckoutDate(SEED_CHECKOUT_DATE);
        loan.setDueDate(dueDate);
        loan.setReturnDate(null);
        loanRepository.save(loan);
    }
}
