package com.pharmacie.ventes.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "ventes")
public class Vente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private String code;

    @Column
    private Long produitId;

    @NotBlank
    @Column(nullable = false)
    private String produit;

    @NotNull
    @Positive
    @Column(nullable = false)
    private Integer quantite;

    @NotNull
    @PositiveOrZero
    @Column(nullable = false)
    private Double prixUnitaire;

    // Calculé côté serveur (quantite * prixUnitaire) après validation de la requête,
    // donc pas de @NotNull ici : il est nul au moment où Spring valide le corps reçu.
    @PositiveOrZero
    @Column(nullable = false)
    private Double total;

    @Column
    private String client;

    @Column
    private String modePaiement;

    @NotNull
    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Vente() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public Long getProduitId() { return produitId; }
    public void setProduitId(Long produitId) { this.produitId = produitId; }

    public String getProduit() { return produit; }
    public void setProduit(String produit) { this.produit = produit; }

    public Integer getQuantite() { return quantite; }
    public void setQuantite(Integer quantite) { this.quantite = quantite; }

    public Double getPrixUnitaire() { return prixUnitaire; }
    public void setPrixUnitaire(Double prixUnitaire) { this.prixUnitaire = prixUnitaire; }

    public Double getTotal() { return total; }
    public void setTotal(Double total) { this.total = total; }

    public String getClient() { return client; }
    public void setClient(String client) { this.client = client; }

    public String getModePaiement() { return modePaiement; }
    public void setModePaiement(String modePaiement) { this.modePaiement = modePaiement; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
