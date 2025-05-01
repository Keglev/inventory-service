package com.smartsupplypro.inventory.repository;

import com.smartsupplypro.inventory.model.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, String> {
    List<Supplier> findByNameContainingIgnoreCase(String name);
}
