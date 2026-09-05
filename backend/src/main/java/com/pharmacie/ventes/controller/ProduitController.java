package com.pharmacie.ventes.controller;

import com.pharmacie.ventes.model.Produit;
import com.pharmacie.ventes.repository.ProduitRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/produits")
public class ProduitController {

    private final ProduitRepository repository;

    public ProduitController(ProduitRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Produit> getAll() {
        return repository.findAll();
    }

    @GetMapping("/recherche")
    public List<Produit> rechercher(@RequestParam("q") String q) {
        if (q == null || q.isBlank()) {
            return repository.findAll();
        }
        return repository.findByNomContainingIgnoreCaseOrCodeContainingIgnoreCase(q, q);
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<Produit> getByCode(@PathVariable String code) {
        Optional<Produit> produit = repository.findByCode(code);
        return produit.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Produit> createOrUpdate(@Valid @RequestBody Produit produit) {
        // Un code vide est normalise en null (le champ est desormais optionnel).
        if (produit.getCode() != null && produit.getCode().isBlank()) {
            produit.setCode(null);
        }

        Optional<Produit> existing = Optional.empty();
        if (produit.getCode() != null) {
            existing = repository.findByCode(produit.getCode());
        }

        if (existing.isPresent()) {
            // Mise a jour : on ne touche pas au stock ici (utiliser
            // /reapprovisionner pour ca), seulement le nom et le prix.
            Produit toUpdate = existing.get();
            toUpdate.setNom(produit.getNom());
            toUpdate.setPrix(produit.getPrix());
            return ResponseEntity.ok(repository.save(toUpdate));
        }
        if (produit.getStock() == null) {
            produit.setStock(0);
        }
        Produit saved = repository.save(produit);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}/reapprovisionner")
    public ResponseEntity<Produit> reapprovisionner(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        Integer quantite = body.get("quantite");
        if (quantite == null || quantite <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La quantite a ajouter doit etre superieure a 0.");
        }
        Produit produit = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produit introuvable"));
        produit.setStock(produit.getStock() + quantite);
        return ResponseEntity.ok(repository.save(produit));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
