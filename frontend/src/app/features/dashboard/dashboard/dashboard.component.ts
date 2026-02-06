import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MainLayoutComponent } from '../../../shared/layouts/main-layout/main-layout.component';
import { TransactionService, Transaction, TransactionStats, getRiskLevel } from '../../../core/services';

/**
 * Feature 4: Dashboard component in component hierarchy (root -> dashboard -> layout -> header)
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MainLayoutComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  transactionsToday = 0;
  fraudAlerts = 0;
  transactions: Transaction[] = [];
  stats: TransactionStats | null = null;
  getRiskLevel = getRiskLevel;

  constructor(private transactionService: TransactionService) {}

  ngOnInit() {
    this.loadTransactions();
    this.loadStats();
  }

  loadTransactions() {
    this.transactionService.getAllTransactions().subscribe({
      next: (data) => {
        this.transactions = data.slice(0, 10);
      },
      error: (err) => console.error('Error loading transactions:', err)
    });
  }

  loadStats() {
    this.transactionService.getTransactionStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.transactionsToday = data.total;
        this.fraudAlerts = data.flagged;
      },
      error: (err) => console.error('Error loading stats:', err)
    });
  }
}

