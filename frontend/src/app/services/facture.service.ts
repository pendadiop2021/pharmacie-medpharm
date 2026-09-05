import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { Vente } from '../models/vente.model';

interface LigneRecu {
  produit: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
}

interface MetaRecu {
  id?: number | string;
  date: string;
  client?: string;
  modePaiement?: string;
}

const LARGEUR_TICKET = 58; // mm — ajuste a 80 si ton imprimante utilise du papier 80mm
const MARGE = 3;

@Injectable({ providedIn: 'root' })
export class FactureService {
  // Adapte ce chemin si le nom de ton fichier logo est different.
  private readonly logoPath = 'assets/logo.jpeg';

  private logoDataUrl: string | null = null;
  private logoPromise: Promise<string | null> | null = null;

  // toLocaleString('fr-FR') insere une espace fine insecable que la police
  // par defaut de jsPDF ne sait pas afficher correctement. On formate donc
  // les montants nous-memes avec une espace normale.
  private formatMontant(n: number): string {
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  private chargerLogo(): Promise<string | null> {
    if (this.logoDataUrl) {
      return Promise.resolve(this.logoDataUrl);
    }
    if (!this.logoPromise) {
      this.logoPromise = fetch(this.logoPath)
        .then(res => {
          if (!res.ok) throw new Error('Logo introuvable a ' + this.logoPath);
          return res.blob();
        })
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

  private ligneTiretee(doc: jsPDF, y: number): void {
    doc.setDrawColor(180, 180, 180);
    doc.setLineDashPattern([0.8, 0.8], 0);
    doc.line(MARGE, y, LARGEUR_TICKET - MARGE, y);
    doc.setLineDashPattern([], 0);
  }

  // Dessine le contenu du ticket sur le document fourni et retourne la
  // hauteur finale utilisee (en mm). Appelee une premiere fois sur un
  // document "brouillon" de grande hauteur pour mesurer, puis une seconde
  // fois sur le document final a la bonne taille.
  private dessiner(doc: jsPDF, lignes: LigneRecu[], meta: MetaRecu, logo: string | null): number {
    const centre = LARGEUR_TICKET / 2;
    let y = 6;

    if (logo) {
      const logoLargeur = 20;
      const logoHauteur = 14;
      try {
        doc.addImage(logo, 'JPEG', centre - logoLargeur / 2, y, logoLargeur, logoHauteur);
        y += logoHauteur + 3;
      } catch (err) {
        console.warn('[Facture] Impossible d\u2019inserer le logo :', err);
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(25, 25, 25);
    doc.text('MedPharm', centre, y, { align: 'center' });
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(90, 90, 90);
    doc.text('Facture de vente', centre, y, { align: 'center' });
    y += 5;

    this.ligneTiretee(doc, y);
    y += 5;

    doc.setFontSize(7.5);
    doc.setTextColor(25, 25, 25);
    doc.text(`Facture n\u00b0 ${meta.id ?? '-'}`, MARGE, y);
    y += 4;
    doc.text(`Date : ${meta.date}`, MARGE, y);
    y += 4;
    if (meta.client) {
      doc.text(`Client : ${meta.client}`, MARGE, y);
      y += 4;
    }
    if (meta.modePaiement) {
      doc.text(`Paiement : ${meta.modePaiement}`, MARGE, y);
      y += 4;
    }

    this.ligneTiretee(doc, y);
    y += 5;

    let total = 0;
    const largeurUtile = LARGEUR_TICKET - 2 * MARGE;

    for (const l of lignes) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      doc.setTextColor(25, 25, 25);
      const lignesNom = doc.splitTextToSize(String(l.produit), largeurUtile);
      doc.text(lignesNom, MARGE, y);
      y += lignesNom.length * 3.6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(70, 70, 70);
      doc.text(`${l.quantite} x ${this.formatMontant(l.prixUnitaire)}`, MARGE, y);
      doc.setTextColor(25, 25, 25);
      doc.text(`${this.formatMontant(l.total)} FCFA`, LARGEUR_TICKET - MARGE, y, { align: 'right' });
      y += 5;

      total += l.total;
    }

    this.ligneTiretee(doc, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(18, 61, 43);
    doc.text('TOTAL', MARGE, y);
    doc.text(`${this.formatMontant(total)} FCFA`, LARGEUR_TICKET - MARGE, y, { align: 'right' });
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(110, 110, 110);
    doc.text('Merci de votre confiance.', centre, y, { align: 'center' });
    y += 6;

    return y;
  }

  private async construireTicket(lignes: LigneRecu[], meta: MetaRecu): Promise<jsPDF> {
    const logo = await this.chargerLogo();

    // 1re passe : document brouillon tres haut, sert uniquement a mesurer
    // la hauteur reellement necessaire (texte, nombre de lignes, etc.).
    const brouillon = new jsPDF({ unit: 'mm', format: [LARGEUR_TICKET, 1000] });
    const hauteur = this.dessiner(brouillon, lignes, meta, logo);

    // 2e passe : document a la bonne taille, pas de papier gaspille.
    const doc = new jsPDF({ unit: 'mm', format: [LARGEUR_TICKET, Math.ceil(hauteur) + 4] });
    this.dessiner(doc, lignes, meta, logo);
    return doc;
  }

  private venteEnLigne(v: Vente): LigneRecu {
    return {
      produit: v.produit,
      quantite: v.quantite,
      prixUnitaire: v.prixUnitaire,
      total: v.total ?? v.quantite * v.prixUnitaire
    };
  }

  async telecharger(vente: Vente): Promise<void> {
    const doc = await this.construireTicket(
      [this.venteEnLigne(vente)],
      { id: vente.id, date: vente.date, client: vente.client, modePaiement: vente.modePaiement }
    );
    doc.save(`facture-${vente.id ?? Date.now()}.pdf`);
  }

  async imprimer(vente: Vente): Promise<void> {
    const doc = await this.construireTicket(
      [this.venteEnLigne(vente)],
      { id: vente.id, date: vente.date, client: vente.client, modePaiement: vente.modePaiement }
    );
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }

  async telechargerGroupee(ventes: Vente[]): Promise<void> {
    if (ventes.length === 0) return;
    const premier = ventes[0];
    const doc = await this.construireTicket(
      ventes.map(v => this.venteEnLigne(v)),
      { id: premier.id, date: premier.date, client: premier.client, modePaiement: premier.modePaiement }
    );
    doc.save(`facture-${premier.id ?? Date.now()}.pdf`);
  }

  async imprimerGroupee(ventes: Vente[]): Promise<void> {
    if (ventes.length === 0) return;
    const premier = ventes[0];
    const doc = await this.construireTicket(
      ventes.map(v => this.venteEnLigne(v)),
      { id: premier.id, date: premier.date, client: premier.client, modePaiement: premier.modePaiement }
    );
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }
}
