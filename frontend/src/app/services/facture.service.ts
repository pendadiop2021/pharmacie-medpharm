import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { Vente } from '../models/vente.model';

interface LigneFacture {
  produit: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
}

interface MetaFacture {
  id?: number | string;
  date: string;
  client?: string;
  modePaiement?: string;
}

const NOM_ENTREPRISE = 'MedPharm';
const ADRESSE_ENTREPRISE = 'Marché Darou Minam, en face polyclinique';
const TELEPHONE_ENTREPRISE = '71 009 31 31 / 76 189 31 31';
const EMAIL_ENTREPRISE = 'medpharmdistribution21@gmail.com';

const MARGE = 15;
const LARGEUR_PAGE = 210;

@Injectable({ providedIn: 'root' })
export class FactureService {
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
        .catch(err => { console.warn('[Facture] Logo non charge :', err); return null; });
    }
    return this.logoPromise;
  }

  private dessiner(doc: jsPDF, lignes: LigneFacture[], meta: MetaFacture, logo: string | null, titre: string = 'FACTURE'): void {    const droite = LARGEUR_PAGE - MARGE;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(20, 20, 20);
    doc.text(NOM_ENTREPRISE, MARGE, 22);

    if (logo) {
      try { doc.addImage(logo, 'JPEG', MARGE, 26, 32, 22); } catch (err) { console.warn(err); }
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(40, 40, 40);
    let yGauche = 55;
    doc.text(`Adresse : ${ADRESSE_ENTREPRISE}`, MARGE, yGauche); yGauche += 5;
    doc.text(`Téléphone : ${TELEPHONE_ENTREPRISE}`, MARGE, yGauche); yGauche += 5;
    doc.text(`Mail : ${EMAIL_ENTREPRISE}`, MARGE, yGauche); yGauche += 5;

    doc.setFillColor(210, 249, 249);
    doc.rect(110, 15, droite - 110, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(20, 20, 20);
    doc.text(titre, 115, 25);
    doc.setFontSize(10);
    doc.text(`N° : ${meta.id ?? '-'}`, 115, 32);

    const yDate = 68;
    doc.setFillColor(210, 249, 249);
    doc.rect(MARGE, yDate, 60, 14, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    doc.text('Date', MARGE + 3, yDate + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(`: ${this.formatDate(meta.date)}`, MARGE + 20, yDate + 6);
    if (meta.modePaiement) {
      doc.setFont('helvetica', 'bold');
      doc.text('Paiement', MARGE + 3, yDate + 11.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`: ${meta.modePaiement}`, MARGE + 20, yDate + 11.5);
    }

    const xClient = 100;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Société et/ou Nom du client', xClient, yDate + 2);
    doc.setFont('helvetica', 'normal');
    doc.text(meta.client && meta.client.trim() ? meta.client : 'MedPharm', xClient, yDate + 7);
    let y = 100;
    const colQuantiteX = MARGE + 2;
    const colDesignationX = MARGE + 22;
    const colPuX = 140;
    const colTotalX = droite - 2;

    doc.setFillColor(210, 249, 249);
    doc.rect(MARGE, y, droite - MARGE, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    doc.text('Quantité', colQuantiteX, y + 6);
    doc.text('Désignation', colDesignationX, y + 6);
    doc.text('Prix unitaire', colPuX, y + 6);
    doc.text('Prix total', colTotalX, y + 6, { align: 'right' });
    y += 9;

    doc.setDrawColor(200, 200, 200);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const hauteurLigne = 9;
    const nbLignesMin = 7;

    let total = 0;
    for (const l of lignes) {
      doc.rect(MARGE, y, droite - MARGE, hauteurLigne);
      doc.setTextColor(30, 30, 30);
      doc.text(String(l.quantite), colQuantiteX, y + 6);
      const nomTronque = doc.splitTextToSize(String(l.produit), colPuX - colDesignationX - 4)[0];
      doc.text(nomTronque, colDesignationX, y + 6);
      doc.text(this.formatMontant(l.prixUnitaire), colPuX, y + 6);
      doc.text(this.formatMontant(l.total), colTotalX, y + 6, { align: 'right' });
      total += l.total;
      y += hauteurLigne;
    }

    const lignesRestantes = Math.max(0, nbLignesMin - lignes.length);
    for (let i = 0; i < lignesRestantes; i++) {
      doc.rect(MARGE, y, droite - MARGE, hauteurLigne);
      y += hauteurLigne;
    }

    y += 14;

  /*  if (logo) {
      try { doc.addImage(logo, 'JPEG', MARGE, y, 38, 26); } catch { /* pas grave  }
    } */

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    doc.text(`Total : ${this.formatMontant(total)} FCFA`, colTotalX, y + 12, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('Merci de votre confiance.', colTotalX, y + 20, { align: 'right' });
  }

  private venteEnLigne(v: Vente): LigneFacture {
    return {
      produit: v.produit,
      quantite: v.quantite,
      prixUnitaire: v.prixUnitaire,
      total: v.total ?? v.quantite * v.prixUnitaire
    };
  }

  private async construireFacture(lignes: LigneFacture[], meta: MetaFacture, titre: string = 'FACTURE'): Promise<jsPDF> {
    const logo = await this.chargerLogo();
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    this.dessiner(doc, lignes, meta, logo, titre);
    return doc;
  }

  async telecharger(vente: Vente): Promise<void> {
    const doc = await this.construireFacture(
      [this.venteEnLigne(vente)],
      { id: vente.id, date: vente.date, client: vente.client, modePaiement: vente.modePaiement }
    );
    doc.save(`facture-${vente.id ?? Date.now()}.pdf`);
  }

  async imprimer(vente: Vente): Promise<void> {
    const doc = await this.construireFacture(
      [this.venteEnLigne(vente)],
      { id: vente.id, date: vente.date, client: vente.client, modePaiement: vente.modePaiement }
    );
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }

  async telechargerGroupee(ventes: Vente[]): Promise<void> {
    if (ventes.length === 0) return;
    const premier = ventes[0];
    const doc = await this.construireFacture(
      ventes.map(v => this.venteEnLigne(v)),
      { id: premier.id, date: premier.date, client: premier.client, modePaiement: premier.modePaiement }
    );
    doc.save(`facture-${premier.id ?? Date.now()}.pdf`);
  }

  async imprimerGroupee(ventes: Vente[]): Promise<void> {
    if (ventes.length === 0) return;
    const premier = ventes[0];
    const doc = await this.construireFacture(
      ventes.map(v => this.venteEnLigne(v)),
      { id: premier.id, date: premier.date, client: premier.client, modePaiement: premier.modePaiement }
    );
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }
  async telechargerDevis(lignes: LigneFacture[], meta: MetaFacture): Promise<void> {
    const doc = await this.construireFacture(lignes, meta, 'DEVIS');
    doc.save(`devis-${meta.id ?? Date.now()}.pdf`);
  }

  async imprimerDevis(lignes: LigneFacture[], meta: MetaFacture): Promise<void> {
    const doc = await this.construireFacture(lignes, meta, 'DEVIS');
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }
}