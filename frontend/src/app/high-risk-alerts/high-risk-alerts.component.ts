import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MainLayoutComponent } from '../shared/layouts/main-layout/main-layout.component';

interface HighRiskTransaction {
  id: string;
  amount: number;
  type: string;
  time: string;
  riskPercentage: number;
}

@Component({
  selector: 'app-high-risk-alerts',
  standalone: true,
  imports: [CommonModule, RouterModule, MainLayoutComponent],
  templateUrl: './high-risk-alerts.component.html',
  styleUrls: []
})
export class HighRiskAlertsComponent {
  highRiskTransactions: HighRiskTransaction[] = [
    { id: 'TXN-2024-001', amount: 4567.89, type: 'Online Purchase', time: '14:32', riskPercentage: 95 },
    { id: 'TXN-2024-005', amount: 1899.00, type: 'Online Purchase', time: '14:19', riskPercentage: 88 }
  ];
}

