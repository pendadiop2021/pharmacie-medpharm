package com.pharmacie.ventes.controller;

import com.pharmacie.ventes.dto.StatsResponse;
import com.pharmacie.ventes.model.Produit;
import com.pharmacie.ventes.model.Vente;
import com.pharmacie.ventes.repository.ProduitRepository;
import com.pharmacie.ventes.repository.VenteRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ventes")
public class VenteController {

    private final VenteRepository repository;
    private final ProduitRepository produitRepository;

    public VenteController(VenteRepository repository, ProduitRepository produitRepository) {
        this.repository = repository;
        this.produitRepository = produitRepository;
    }

    @GetMapping
    public List<Vente> getAll(@RequestParam(defaultValue = "all") String range) {
        LocalDate today = LocalDate.now();
        LocalDate start;
        LocalDate end = today;

        switch (range) {
            case "today" -> start = today;
            case "week" -> start = today.minusDays(6);
            case "month" -> start = today.withDayOfMonth(1);
            default -> {
                return repository.findAll().stream()
                        .sorted((a, b) -> {
                            int cmp = b.getDate().compareTo(a.getDate());
                            return cmp != 0 ? cmp : b.getCreatedAt().compareTo(a.getCreatedAt());
                        })
                        .collect(Collectors.toList());
            }
        }
        return repository.findByDateBetweenOrderByDateDescCreatedAtDesc(start, end);
    }

    @PostMapping
    public ResponseEntity<Vente> create(@Valid @RequestBody Vente vente) {
        vente.setTotal(vente.getQuantite() * vente.getPrixUnitaire());
        if (vente.getDate() == null) {
            vente.setDate(LocalDate.now());
        }

        // Si la vente est liee a un produit du catalogue (par id, ou a
        // defaut par code), on verifie et decremente le stock.
        Optional<Produit> produitOpt = Optional.empty();
        if (vente.getProduitId() != null) {
            produitOpt = produitRepository.findById(vente.getProduitId());
        } else if (vente.getCode() != null && !vente.getCode().isBlank()) {
            produitOpt = produitRepository.findByCode(vente.getCode());
        }

        if (produitOpt.isPresent()) {
            Produit produit = produitOpt.get();
            if (produit.getStock() < vente.getQuantite()) {
                String message = produit.getStock() <= 0
                        ? "Stock épuisé pour " + produit.getNom() + ". Impossible d'enregistrer la vente."
                        : "Stock insuffisant pour " + produit.getNom() + " (reste " + produit.getStock() + "). Impossible d'enregistrer la vente.";
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
            }
            produit.setStock(produit.getStock() - vente.getQuantite());
            produitRepository.save(produit);
        }

        Vente saved = repository.save(vente);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public StatsResponse stats() {
        LocalDate today = LocalDate.now();
        LocalDate firstOfMonth = today.withDayOfMonth(1);
        LocalDate lastOfMonth = today.with(TemporalAdjusters.lastDayOfMonth());

        List<Vente> todaySales = repository.findByDateBetweenOrderByDateDescCreatedAtDesc(today, today);
        List<Vente> monthSales = repository.findByDateBetweenOrderByDateDescCreatedAtDesc(firstOfMonth, lastOfMonth);

        double todayTotal = todaySales.stream().mapToDouble(Vente::getTotal).sum();
        double monthTotal = monthSales.stream().mapToDouble(Vente::getTotal).sum();
        long totalCount = repository.count();

        return new StatsResponse(todayTotal, todaySales.size(), monthTotal, totalCount);
    }
}
