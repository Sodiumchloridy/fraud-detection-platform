import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard/dashboard.component';
import { FlaggedTransactionsComponent } from './features/dashboard/flagged-transactions/flagged-transactions.component';
import { TransactionDetailsComponent } from './features/dashboard/transaction-details/transaction-details.component';
import { PosSimulatorComponent } from './features/pos-simulator/pos-simulator.component';
import { SettingsComponent } from './features/settings/settings/settings.component';
import { UserManagementComponent } from './features/admin/user-management/user-management.component';
import { SystemSettingsComponent } from './features/admin/system-settings/system-settings.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'flagged-transactions', component: FlaggedTransactionsComponent, canActivate: [authGuard] },
  { path: 'transaction/:id', component: TransactionDetailsComponent, canActivate: [authGuard] },
  { path: 'simulator', component: PosSimulatorComponent, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
  { path: 'admin/users', component: UserManagementComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/system-settings', component: SystemSettingsComponent, canActivate: [authGuard, adminGuard] },
  { path: '**', component: NotFoundComponent }
];

