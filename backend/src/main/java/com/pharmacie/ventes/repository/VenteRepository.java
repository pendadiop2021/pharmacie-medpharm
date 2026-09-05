package com.pharmacie.ventes.repository;

import com.pharmacie.ventes.model.Vente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface VenteRepository extends JpaRepository<Vente, Long> {
    List<Vente> findByDateBetweenOrderByDateDescCreatedAtDesc(LocalDate start, LocalDate end);
}
