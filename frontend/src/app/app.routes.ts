import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HighRiskAlertsComponent } from './high-risk-alerts/high-risk-alerts.component';
import { TransactionDetailsComponent } from './transaction-details/transaction-details.component';
import { SettingsComponent } from './settings/settings.component';
import { NotFoundComponent } from './not-found/not-found.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'high-risk-alerts', component: HighRiskAlertsComponent },
  { path: 'transaction/:id', component: TransactionDetailsComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '**', component: NotFoundComponent }
];

