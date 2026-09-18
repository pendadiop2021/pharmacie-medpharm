package com.pharmacie.ventes.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

@Entity
@Table(name = "produits")
public class Produit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String code;

    @NotBlank
    @Column(nullable = false)
    private String nom;

    @NotNull
    @PositiveOrZero
    @Column(nullable = false)
    private Double prixCession;

    @NotNull
    @PositiveOrZero
    @Column(nullable = false)
    private Double prixVente;

    @NotNull
    @PositiveOrZero
    @Column(nullable = false)
    private Integer stock = 0;

    public Produit() {}

    public Produit(String code, String nom, Double prixCession, Double prixVente) {
        this.code = code;
        this.nom = nom;
        this.prixCession = prixCession;
        this.prixVente = prixVente;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public Double getPrixCession() { return prixCession; }
    public void setPrixCession(Double prixCession) { this.prixCession = prixCession; }

    public Double getPrixVente() { return prixVente; }
    public void setPrixVente(Double prixVente) { this.prixVente = prixVente; }

    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }
}
