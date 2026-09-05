import { Routes } from '@angular/router';
import { VentesComponent } from './pages/ventes/ventes.component';
import { ProduitsComponent } from './pages/produits/produits.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'ventes' },
  { path: 'ventes', component: VentesComponent },
  { path: 'produits', component: ProduitsComponent }
];
