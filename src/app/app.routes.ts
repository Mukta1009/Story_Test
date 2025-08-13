import { Routes } from '@angular/router';
import { BillingList } from './features/billing-list/billing-list';
import { GenerateBill } from './features/generate-bill/generate-bill';
import { TestDataComponent } from './features/test-data/test-data';
import { ViewBill } from './features/view-bill/view-bill';

export const routes: Routes = [
  { path: '', redirectTo: 'billing', pathMatch: 'full' },
  { path: 'billing', component: BillingList },
  { path: 'billing/new', component: GenerateBill },
  { path: 'billing/view/:id', component: ViewBill }
];