package com.pharmacie.ventes.repository;

import com.pharmacie.ventes.model.Produit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProduitRepository extends JpaRepository<Produit, Long> {
    Optional<Produit> findByCode(String code);

    List<Produit> findByNomContainingIgnoreCaseOrCodeContainingIgnoreCase(String nom, String code);
}
