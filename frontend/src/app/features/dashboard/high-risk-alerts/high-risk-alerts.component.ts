import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MainLayoutComponent } from '../../../shared/layouts/main-layout/main-layout.component';
import { TransactionService, getRiskLevel } from '../../../core/services';

@Component({
  selector: 'app-high-risk-alerts',
  standalone: true,
  imports: [CommonModule, RouterLink, MainLayoutComponent],
  templateUrl: './high-risk-alerts.component.html',
  styleUrls: []
})
export class HighRiskAlertsComponent {
  getRiskLevel = getRiskLevel;
  highRiskTransactions$ = inject(TransactionService).getHighRiskTransactions();
}

