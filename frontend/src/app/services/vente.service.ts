import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Stats, Vente } from '../models/vente.model';

@Injectable({ providedIn: 'root' })
export class VenteService {
  private baseUrl = 'http://localhost:8080/api/ventes';

  constructor(private http: HttpClient) {}

  getAll(range: 'today' | 'week' | 'month' | 'all' = 'all'): Observable<Vente[]> {
    const params = new HttpParams().set('range', range);
    return this.http.get<Vente[]>(this.baseUrl, { params });
  }

  create(vente: Vente): Observable<Vente> {
    return this.http.post<Vente>(this.baseUrl, vente);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getStats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.baseUrl}/stats`);
  }
}
