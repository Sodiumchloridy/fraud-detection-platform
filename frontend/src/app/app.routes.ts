import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard/dashboard.component';
import { HighRiskAlertsComponent } from './features/dashboard/high-risk-alerts/high-risk-alerts.component';
import { TransactionDetailsComponent } from './features/dashboard/transaction-details/transaction-details.component';
import { PosSimulatorComponent } from './features/pos-simulator/pos-simulator.component';
import { SettingsComponent } from './features/settings/settings/settings.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'high-risk-alerts', component: HighRiskAlertsComponent, canActivate: [authGuard] },
  { path: 'transaction/:id', component: TransactionDetailsComponent, canActivate: [authGuard] },
  { path: 'simulator', component: PosSimulatorComponent, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
  { path: '**', component: NotFoundComponent }
];

