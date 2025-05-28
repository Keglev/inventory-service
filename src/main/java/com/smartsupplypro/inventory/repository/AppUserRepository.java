package com.smartsupplypro.inventory.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.smartsupplypro.inventory.model.AppUser;
import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, String> {
    Optional<AppUser> findByEmail(String email);
    long count();
}
