import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { UserCreateComponent } from './user-create/user-create.component';
import { UserEditComponent } from './user-edit/user-edit.component';
import { PermissionsComponent } from './permissions/permissions.component';
import { HighRiskAlertsComponent } from './high-risk-alerts/high-risk-alerts.component';
import { TransactionDetailsComponent } from './transaction-details/transaction-details.component';
import { SettingsComponent } from './settings/settings.component';
import { NotFoundComponent } from './not-found/not-found.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'admin', component: AdminDashboardComponent },
  { path: 'admin/create-user', component: UserCreateComponent },
  { path: 'admin/edit-user/:id', component: UserEditComponent },
  { path: 'admin/permissions', component: PermissionsComponent },
  { path: 'high-risk-alerts', component: HighRiskAlertsComponent },
  { path: 'transaction/:id', component: TransactionDetailsComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '**', component: NotFoundComponent }
];

