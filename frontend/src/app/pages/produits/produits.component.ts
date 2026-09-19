import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProduitService } from '../../services/produit.service';
import { Produit } from '../../models/produit.model';
import { ScannerModalComponent } from '../../components/scanner-modal/scanner-modal.component';

@Component({
  selector: 'app-produits',
  standalone: true,
  imports: [CommonModule, FormsModule, ScannerModalComponent],
  templateUrl: './produits.component.html',
  styleUrl: './produits.component.css'
})
export class ProduitsComponent implements OnInit {
  products: Produit[] = [];
  form: Produit = this.emptyForm();
  errorMessage = '';
  scannerOpen = false;
  recherche = '';

  // Reapprovisionnement : id du produit en cours d'edition + quantite saisie
  reappro: { [id: number]: number } = {};

  constructor(private produitService: ProduitService) {}

  ngOnInit(): void {
    this.load();
  }

    emptyForm(): Produit {
    return { code: '', nom: '', prixCession: 0, prixVente: 0, stock: 0 };
  }

  load(): void {
    this.produitService.getAll().subscribe(list => {
      this.products = [...list].sort((a, b) => a.nom.localeCompare(b.nom));
    });
  }

  get produitsFiltres(): Produit[] {
    const q = this.recherche.trim().toLowerCase();
    if (!q) return this.products;
    return this.products.filter(p =>
      p.nom.toLowerCase().includes(q) || (p.code ?? '').toLowerCase().includes(q)
    );
  }
  get valeurTotaleCession(): number {
    return this.products.reduce((acc, p) => acc + p.prixCession * p.stock, 0);
  }

  get valeurTotaleVente(): number {
    return this.products.reduce((acc, p) => acc + p.prixVente * p.stock, 0);
  }

  get margeTotale(): number {
    return this.valeurTotaleVente - this.valeurTotaleCession;
  }

  onCodeScanned(code: string): void {
    this.form.code = code;
  }

  submit(): void {
    this.errorMessage = '';
    if (!this.form.nom?.trim()) {
      this.errorMessage = 'Indiquez le nom du produit.';
      return;
    }
    if (this.form.prixCession === null || this.form.prixCession === undefined || this.form.prixCession < 0) {
      this.errorMessage = 'Indiquez un prix de cession valide.';
      return;
    }
    if (this.form.prixVente === null || this.form.prixVente === undefined || this.form.prixVente < 0) {
      this.errorMessage = 'Indiquez un prix de vente valide.';
      return;
    }

    this.produitService.save(this.form).subscribe({
      next: () => {
        this.form = this.emptyForm();
        this.load();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || "Erreur d'enregistrement — vérifiez que le serveur est démarré.";
      }
    });
  }

  reapprovisionner(produit: Produit): void {
    const quantite = this.reappro[produit.id!];
    if (!quantite || quantite <= 0) {
      return;
    }
    this.produitService.reapprovisionner(produit.id!, quantite).subscribe({
      next: () => {
        this.reappro[produit.id!] = 0;
        this.load();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || "Erreur lors du réapprovisionnement.";
      }
    });
  }

  remove(id?: number): void {
    if (!id) return;
    if (!confirm('Voulez-vous vraiment supprimer ce produit ?')) return;
    this.produitService.delete(id).subscribe(() => this.load());
  }
}
