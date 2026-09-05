export interface Vente {
  id?: number;
  code?: string;
  produit: string;
  quantite: number;
  prixUnitaire: number;
  total?: number;
  client?: string;
  modePaiement?: string;
  produitId?: number;
  date: string; // format ISO yyyy-MM-dd
  createdAt?: string;
}

export interface Stats {
  todayTotal: number;
  todayCount: number;
  monthTotal: number;
  totalCount: number;
}
