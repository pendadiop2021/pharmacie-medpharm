import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { VenteService } from '../../services/vente.service';
import { ProduitService } from '../../services/produit.service';
import { FactureService } from '../../services/facture.service';
import { Stats, Vente } from '../../models/vente.model';
import { Produit } from '../../models/produit.model';
import { ScannerModalComponent } from '../../components/scanner-modal/scanner-modal.component';

type Range = 'today' | 'week' | 'month' | 'all';

interface LigneVente {
  code?: string;
  produit: string;
  quantite: number;
  prixUnitaire: number;
  produitId?: number;
}

@Component({
  selector: 'app-ventes',
  standalone: true,
  imports: [CommonModule, FormsModule, ScannerModalComponent],
  templateUrl: './ventes.component.html',
  styleUrl: './ventes.component.css'
})
export class VentesComponent implements OnInit {
  sales: Vente[] = [];
  stats: Stats = { todayTotal: 0, todayCount: 0, monthTotal: 0, totalCount: 0 };
  currentRange: Range = 'today';
  scannerOpen = false;

  // Informations communes a la vente (client/date), partagees par toutes les lignes du panier
  client = '';
  modePaiement = 'Espèces';
  date = new Date().toISOString().slice(0, 10);

  // Ligne en cours de saisie
  ligne: LigneVente = this.ligneVide();
  matchHint = '';

  // Panier : plusieurs produits pour un meme client, valides en une seule fois
  panier: LigneVente[] = [];

  errorMessage = '';
  saveState = '';
  lastSavedGroup: Vente[] | null = null;

  // Recherche de produit par nom (en plus du scan/code)
  produits: Produit[] = [];
  rechercheProduit = '';
  stockActuel: number | null = null;

  constructor(
    private venteService: VenteService,
    private produitService: ProduitService,
    private factureService: FactureService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadSales();
    this.loadProduits();
  }

  loadProduits(): void {
    this.produitService.getAll().subscribe(list => this.produits = list);
  }

  get suggestionsProduits(): Produit[] {
    const q = this.rechercheProduit.trim().toLowerCase();
    if (!q) return [];
    return this.produits.filter(p => p.nom.toLowerCase().includes(q)).slice(0, 6);
  }

  choisirProduit(p: Produit): void {
    this.ligne.code = p.code;
    this.ligne.produit = p.nom;
    this.ligne.prixUnitaire = p.prixVente;
    this.ligne.produitId = p.id;
    this.stockActuel = p.stock;
    this.matchHint = `Produit reconnu : ${p.nom} (${p.prixVente} FCFA) — Stock restant : ${p.stock}`;
    this.rechercheProduit = '';
  }

  ligneVide(): LigneVente {
    return { code: '', produit: '', quantite: 1, prixUnitaire: 0 };
  }

  get totalLigne(): number {
    return (this.ligne.quantite || 0) * (this.ligne.prixUnitaire || 0);
  }

  get totalPanier(): number {
    return this.panier.reduce((acc, l) => acc + l.quantite * l.prixUnitaire, 0);
  }

  loadStats(): void {
    this.venteService.getStats().subscribe(s => this.stats = s);
  }

  loadSales(): void {
    this.venteService.getAll(this.currentRange).subscribe(list => this.sales = list);
  }

  setRange(range: Range): void {
    this.currentRange = range;
    this.loadSales();
  }

  get rangeTotal(): number {
    return this.sales.reduce((acc, s) => acc + (s.total || 0), 0);
  }
  get groupesAffiches(): { cle: string; ventes: Vente[]; total: number; date: string; client?: string }[] {
    const map = new Map<string, Vente[]>();
    for (const v of this.sales) {
      const cle = v.reference || `seul-${v.id}`;
      if (!map.has(cle)) map.set(cle, []);
      map.get(cle)!.push(v);
    }
    return Array.from(map.entries())
      .map(([cle, ventes]) => ({
        cle,
        ventes,
        total: ventes.reduce((acc, v) => acc + (v.total ?? 0), 0),
        date: ventes[0].date,
        client: ventes[0].client
      }))
      .sort((a, b) => (b.ventes[0].createdAt || '').localeCompare(a.ventes[0].createdAt || ''));
  }

  removeGroupe(ventes: Vente[]): void {
    const texte = ventes.length > 1 ? `ces ${ventes.length} ventes` : 'cette vente';
    if (!confirm(`Voulez-vous vraiment supprimer ${texte} ?`)) return;
    const requetes = ventes.filter(v => v.id).map(v => this.venteService.delete(v.id!));
    forkJoin(requetes).subscribe(() => {
      this.loadStats();
      this.loadSales();
    });
  }

  nomsProduits(ventes: Vente[]): string {
    return ventes.map(v => v.produit).join(', ');
  }

  onCodeChange(): void {
    const code = (this.ligne.code || '').trim();
    if (!code) {
      this.matchHint = '';
      this.stockActuel = null;
      return;
    }
    this.produitService.getByCode(code).subscribe({
      next: (p) => {
        this.ligne.produit = p.nom;
        this.ligne.prixUnitaire = p.prixVente;
        this.ligne.produitId = p.id;
        this.stockActuel = p.stock;
        this.matchHint = `Produit reconnu : ${p.nom} (${p.prixVente} FCFA) — Stock restant : ${p.stock}`;
      },
      error: () => {
        this.ligne.produitId = undefined;
        this.stockActuel = null;
        this.matchHint = "Code inconnu — aucun produit associé. Vous pouvez le renseigner ci-dessous, ou l'ajouter dans l'onglet Produits.";
      }
    });
  }

  onCodeScanned(code: string): void {
    this.ligne.code = code;
    this.onCodeChange();
  }

  ajouterAuPanier(): void {
    this.errorMessage = '';
    if (!this.ligne.produit?.trim()) {
      this.errorMessage = 'Indiquez le nom du produit.';
      return;
    }
    if (!this.ligne.quantite || this.ligne.quantite <= 0) {
      this.errorMessage = 'Indiquez une quantité valide.';
      return;
    }
    if (this.ligne.prixUnitaire === null || this.ligne.prixUnitaire === undefined || this.ligne.prixUnitaire < 0) {
      this.errorMessage = 'Indiquez un prix unitaire valide.';
      return;
    }

    // Verification immediate si on connait le stock du produit selectionne
    // (evite d'attendre la reponse du serveur pour un cas frequent).
    if (this.ligne.produitId && this.stockActuel !== null) {
      const dejaDansLePanier = this.panier
        .filter(l => l.produitId === this.ligne.produitId)
        .reduce((acc, l) => acc + l.quantite, 0);
      const restant = this.stockActuel - dejaDansLePanier;
      if (restant <= 0) {
        this.errorMessage = `Stock épuisé pour ${this.ligne.produit}. Impossible d'ajouter cette vente.`;
        return;
      }
      if (this.ligne.quantite > restant) {
        this.errorMessage = `Stock insuffisant pour ${this.ligne.produit} (reste ${restant}).`;
        return;
      }
    }

    this.panier.push({ ...this.ligne });
    this.ligne = this.ligneVide();
    this.matchHint = '';
    this.stockActuel = null;
  }

  retirerDuPanier(index: number): void {
    this.panier.splice(index, 1);
  }

  validerVente(): void {
    this.errorMessage = '';
    if (this.panier.length === 0) {
      this.errorMessage = 'Ajoutez au moins un produit au panier avant de valider.';
      return;
    }

        const reference = 'V' + Date.now().toString(36).toUpperCase();

    this.saveState = 'Enregistrement…';
    const requetes = this.panier.map(l => this.venteService.create({
      code: l.code,
      produit: l.produit,
      quantite: l.quantite,
      prixUnitaire: l.prixUnitaire,
      produitId: l.produitId,
      client: this.client,
      modePaiement: this.modePaiement,
      date: this.date,
      reference
    }));

    forkJoin(requetes).subscribe({
      next: (savedList) => {
        this.saveState = 'Enregistré';
        this.lastSavedGroup = savedList;
        this.panier = [];
        this.loadStats();
        this.loadSales();
        this.loadProduits();
        setTimeout(() => this.saveState = '', 1500);
      },
      error: (err) => {
        this.saveState = '';
        this.errorMessage = err?.error?.message || "Erreur d'enregistrement — vérifiez que le serveur est démarré.";
      }
    });
  }
  private genererLignesDevis() {
    return this.panier.map(l => ({
      produit: l.produit,
      quantite: l.quantite,
      prixUnitaire: l.prixUnitaire,
      total: l.quantite * l.prixUnitaire
    }));
  }

  telechargerDevis(): void {
    if (this.panier.length === 0) {
      this.errorMessage = 'Ajoutez au moins un produit au panier avant de générer un devis.';
      return;
    }
    const meta = {
      id: 'DEV-' + Date.now().toString().slice(-6),
      date: this.date,
      client: this.client,
      modePaiement: this.modePaiement
    };
    this.factureService.telechargerDevis(this.genererLignesDevis(), meta);
  }

  imprimerDevis(): void {
    if (this.panier.length === 0) {
      this.errorMessage = 'Ajoutez au moins un produit au panier avant de générer un devis.';
      return;
    }
    const meta = {
      id: 'DEV-' + Date.now().toString().slice(-6),
      date: this.date,
      client: this.client,
      modePaiement: this.modePaiement
    };
    this.factureService.imprimerDevis(this.genererLignesDevis(), meta);
  }

  imprimerFacture(vente: Vente): void {
    this.factureService.imprimer(vente);
  }

  telechargerFacture(vente: Vente): void {
    this.factureService.telecharger(vente);
  }

  imprimerFactureGroupee(ventes: Vente[] = this.lastSavedGroup ?? []): void {
    if (ventes.length === 0) return;
    this.factureService.imprimerGroupee(ventes);
  }

  telechargerFactureGroupee(ventes: Vente[] = this.lastSavedGroup ?? []): void {
    if (ventes.length === 0) return;
    this.factureService.telechargerGroupee(ventes);
  }

  remove(id?: number): void {
    if (!id) return;
    if (!confirm('Voulez-vous vraiment supprimer cette vente ?')) return;
    this.venteService.delete(id).subscribe(() => {
      this.loadStats();
      this.loadSales();
    });
  }
}
