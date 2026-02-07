import { Component, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MainLayoutComponent } from '../../../shared/layouts/main-layout/main-layout.component';
import { TransactionService, Transaction, TransactionStats, getRiskLevel } from '../../../core/services';
import { BehaviorSubject, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MainLayoutComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnDestroy {
  getRiskLevel = getRiskLevel;

  /** Holds the latest 20 transactions, updated in real-time via SSE. */
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  transactions$ = this.transactionsSubject.asObservable();

  /** Holds the latest stats, updated in real-time via SSE. */
  private statsSubject = new BehaviorSubject<TransactionStats | null>(null);
  stats$ = this.statsSubject.asObservable();

  private subscriptions = new Subscription();

  constructor(private transactionService: TransactionService) {
    // 1. Load initial data via REST
    this.subscriptions.add(
      this.transactionService.getAllTransactions().pipe(
        switchMap(data => {
          const sorted = data
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 20);
          this.transactionsSubject.next(sorted);
          return this.transactionService.getTransactionStats();
        })
      ).subscribe(stats => this.statsSubject.next(stats))
    );

    // 2. Subscribe to real-time transaction events via SSE
    this.subscriptions.add(
      this.transactionService.streamTransactions().subscribe(newTxn => {
        const current = this.transactionsSubject.value;
        // Prepend new transaction and keep only latest 20
        const updated = [newTxn, ...current].slice(0, 20);
        this.transactionsSubject.next(updated);
      })
    );

    // 3. Subscribe to real-time stats events via SSE
    this.subscriptions.add(
      this.transactionService.streamStats().subscribe(stats => {
        this.statsSubject.next(stats);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  trackByTransactionId(index: number, transaction: Transaction): string {
    return transaction.id;
  }
}

