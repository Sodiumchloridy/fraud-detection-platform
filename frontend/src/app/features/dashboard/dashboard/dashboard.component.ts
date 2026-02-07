import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MainLayoutComponent } from '../../../shared/layouts/main-layout/main-layout.component';
import { TransactionService, Transaction, TransactionStats, getRiskLevel } from '../../../core/services';
import { interval, Subscription } from 'rxjs';
import { startWith } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MainLayoutComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  transactionsToday = 0;
  fraudAlerts = 0;
  transactions: Transaction[] = [];
  stats: TransactionStats | null = null;
  getRiskLevel = getRiskLevel;
  
  private updateSubscription!: Subscription;

  constructor(private transactionService: TransactionService) {}

  ngOnInit() {
    this.updateSubscription = interval(1000)
      .pipe(startWith(0))
      .subscribe(() => {
        this.loadTransactions();
        this.loadStats();
      });
  }

  ngOnDestroy() {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }

  loadTransactions() {
    this.transactionService.getAllTransactions().subscribe({
      next: (data) => {
        // Sort descending by timestamp (newest first) and show latest 20
        this.transactions = data
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 20);
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

