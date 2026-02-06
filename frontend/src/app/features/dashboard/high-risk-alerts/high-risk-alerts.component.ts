import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MainLayoutComponent } from '../../../shared/layouts/main-layout/main-layout.component';
import { TransactionService, Transaction, getRiskLevel } from '../../../core/services';

@Component({
  selector: 'app-high-risk-alerts',
  standalone: true,
  imports: [CommonModule, RouterModule, MainLayoutComponent],
  templateUrl: './high-risk-alerts.component.html',
  styleUrls: []
})
export class HighRiskAlertsComponent implements OnInit {
  highRiskTransactions: Transaction[] = [];
  getRiskLevel = getRiskLevel;

  constructor(private transactionService: TransactionService) {}

  ngOnInit() {
    this.loadHighRiskTransactions();
  }

  loadHighRiskTransactions() {
    this.transactionService.getHighRiskTransactions().subscribe({
      next: (data) => {
        this.highRiskTransactions = data;
      },
      error: (err) => console.error('Error loading high-risk transactions:', err)
    });
  }
}

