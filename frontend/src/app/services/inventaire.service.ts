import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { Produit } from '../models/produit.model';

const NOM_ENTREPRISE = 'MedPharm';
const ADRESSE_ENTREPRISE = 'Marché Darou Minam, en face polyclinique';
const TELEPHONE_ENTREPRISE = '71 009 31 31 / 76 189 31 31';

const LARGEUR = 297;
const HAUTEUR = 210;
const MARGE = 12;

const COL_NUM = MARGE + 2;
const COL_NOM = 24;
const COL_CODE = 114;
const COL_STOCK_R = 168;
const COL_CESSION_R = 202;
const COL_VENTE_R = 236;
const COL_PEREMPTION = 242;

@Injectable({ providedIn: 'root' })
export class InventaireService {
  private readonly logoPath = 'assets/logo.jpeg';
  private logoDataUrl: string | null = null;
  private logoPromise: Promise<string | null> | null = null;

  private formatMontant(n: number): string {
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  private formatDate(dateStr: string): string {
    const [annee, mois, jour] = dateStr.split('-');
    if (!annee || !mois || !jour) return dateStr;
    return `${jour}/${mois}/${annee}`;
  }

  private dateDuJour(): string {
    const d = new Date();
    const jj = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${jj}/${mm}/${d.getFullYear()}`;
  }

  private dateIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private joursAvantPeremption(p: Produit): number | null {
    if (!p.datePeremption) return null;
    const aujourdHui = new Date();
    aujourdHui.setHours(0, 0, 0, 0);
    const dateExp = new Date(p.datePeremption + 'T00:00:00');
    return Math.round((dateExp.getTime() - aujourdHui.getTime()) / (1000 * 60 * 60 * 24));
  }

  private chargerLogo(): Promise<string | null> {
    if (this.logoDataUrl) return Promise.resolve(this.logoDataUrl);
    if (!this.logoPromise) {
      this.logoPromise = fetch(this.logoPath)
        .then(res => { if (!res.ok) throw new Error('Logo introuvable'); return res.blob(); })
        .then(blob => new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }))
        .then(dataUrl => { this.logoDataUrl = dataUrl; return dataUrl; })
        .catch(err => { console.warn('[Inventaire] Logo non charge :', err); return null; });
    }
    return this.logoPromise;
  }

  private enteteTableau(doc: jsPDF, y: number): number {
    doc.setFillColor(210, 249, 249);
    doc.rect(MARGE, y, LARGEUR - 2 * MARGE, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(20, 20, 20);
    doc.text('N°', COL_NUM, y + 5.5);
    doc.text('Désignation', COL_NOM, y + 5.5);
    doc.text('Code', COL_CODE, y + 5.5);
    doc.text('Stock', COL_STOCK_R, y + 5.5, { align: 'right' });
    doc.text('Prix cession', COL_CESSION_R, y + 5.5, { align: 'right' });
    doc.text('Prix vente', COL_VENTE_R, y + 5.5, { align: 'right' });
    doc.text('Péremption', COL_PEREMPTION, y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    return y + 8;
  }

  private dessiner(doc: jsPDF, produits: Produit[], logo: string | null): void {
    const droite = LARGEUR - MARGE;

    if (logo) {
      try { doc.addImage(logo, 'JPEG', MARGE, 10, 26, 18); } catch (err) { console.warn(err); }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(20, 20, 20);
    doc.text(NOM_ENTREPRISE, MARGE + 32, 17);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    doc.text(ADRESSE_ENTREPRISE, MARGE + 32, 23);
    doc.text(`Téléphone : ${TELEPHONE_ENTREPRISE}`, MARGE + 32, 28);

    doc.setFillColor(210, 249, 249);
    doc.rect(droite - 85, 10, 85, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(20, 20, 20);
    doc.text('INVENTAIRE DES PRODUITS', droite - 82, 19);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Au ${this.dateDuJour()}`, droite - 82, 26);

    const totalStock = produits.reduce((a, p) => a + (p.stock ?? 0), 0);
    const valCession = produits.reduce((a, p) => a + (p.prixCession ?? 0) * (p.stock ?? 0), 0);
    const valVente = produits.reduce((a, p) => a + (p.prixVente ?? 0) * (p.stock ?? 0), 0);

    doc.setFontSize(9.5);
    doc.setTextColor(40, 40, 40);
    doc.text(`${produits.length} produit(s) · ${totalStock} article(s) en stock`, MARGE, 38);

    let y = this.enteteTableau(doc, 42);

    produits.forEach((p, i) => {
      if (y > HAUTEUR - 25) {
        doc.addPage();
        y = this.enteteTableau(doc, 15);
      }
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);

      doc.text(String(i + 1), COL_NUM, y + 5);
      const nom = doc.splitTextToSize(String(p.nom), COL_CODE - COL_NOM - 4)[0];
      doc.text(nom, COL_NOM, y + 5);
      doc.text(p.code ? String(p.code) : '-', COL_CODE, y + 5);

      const stock = p.stock ?? 0;
      if (stock <= 5) doc.setTextColor(174, 68, 56);
      doc.text(String(stock), COL_STOCK_R, y + 5, { align: 'right' });
      doc.setTextColor(30, 30, 30);

      doc.text(this.formatMontant(p.prixCession ?? 0), COL_CESSION_R, y + 5, { align: 'right' });
      doc.text(this.formatMontant(p.prixVente ?? 0), COL_VENTE_R, y + 5, { align: 'right' });

      let txtPeremption = '-';
      if (p.datePeremption) {
        const j = this.joursAvantPeremption(p);
        txtPeremption = this.formatDate(p.datePeremption);
        if (j !== null && j < 0) {
          txtPeremption += ' (périmé)';
          doc.setTextColor(174, 68, 56);
        } else if (j !== null && j <= 90) {
          txtPeremption += ' (bientôt)';
          doc.setTextColor(201, 122, 43);
        }
      }
      doc.text(txtPeremption, COL_PEREMPTION, y + 5);
      doc.setTextColor(30, 30, 30);

      doc.setDrawColor(220, 220, 220);
      doc.line(MARGE, y + 7, droite, y + 7);
      y += 7;
    });

    if (y > HAUTEUR - 45) {
      doc.addPage();
      y = 20;
    } else {
      y += 8;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    doc.text(`Total articles en stock : ${totalStock}`, droite, y, { align: 'right' });
    y += 6;
    doc.text(`Valeur du stock (cession) : ${this.formatMontant(valCession)} FCFA`, droite, y, { align: 'right' });
    y += 6;
    doc.text(`Valeur du stock (vente) : ${this.formatMontant(valVente)} FCFA`, droite, y, { align: 'right' });
    y += 6;
    doc.text(`Marge potentielle : ${this.formatMontant(valVente - valCession)} FCFA`, droite, y, { align: 'right' });
  }

  private async construire(produits: Produit[]): Promise<jsPDF> {
    const logo = await this.chargerLogo();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    this.dessiner(doc, produits, logo);

    const nbPages = doc.getNumberOfPages();
    for (let i = 1; i <= nbPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(130, 130, 130);
      doc.text(`Page ${i} / ${nbPages}`, LARGEUR / 2, HAUTEUR - 8, { align: 'center' });
    }
    return doc;
  }

  async telecharger(produits: Produit[]): Promise<void> {
    const doc = await this.construire(produits);
    doc.save(`inventaire-${this.dateIso()}.pdf`);
  }

  async imprimer(produits: Produit[]): Promise<void> {
    const doc = await this.construire(produits);
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }
}
