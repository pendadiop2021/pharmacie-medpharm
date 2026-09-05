import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Produit } from '../models/produit.model';

@Injectable({ providedIn: 'root' })
export class ProduitService {
  // URL relative : fonctionne en production (frontend et backend sur la
  // meme origine) et en local via le proxy Angular (voir proxy.conf.json).
  private baseUrl = '/api/produits';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Produit[]> {
    return this.http.get<Produit[]>(this.baseUrl);
  }

  getByCode(code: string): Observable<Produit> {
    return this.http.get<Produit>(`${this.baseUrl}/code/${encodeURIComponent(code)}`);
  }

  rechercher(q: string): Observable<Produit[]> {
    return this.http.get<Produit[]>(`${this.baseUrl}/recherche`, { params: new HttpParams().set('q', q) });
  }

  reapprovisionner(id: number, quantite: number): Observable<Produit> {
    return this.http.put<Produit>(`${this.baseUrl}/${id}/reapprovisionner`, { quantite });
  }

  save(produit: Produit): Observable<Produit> {
    return this.http.post<Produit>(this.baseUrl, produit);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
