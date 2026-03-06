import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, switchMap } from 'rxjs';
import { MainLayoutComponent } from '../../../shared/layouts/main-layout/main-layout.component';
import { TransactionService, Transaction, getStatusBadgeClass } from '../../../core/services';

@Component({
  selector: 'app-high-risk-alerts',
  standalone: true,
  imports: [CommonModule, RouterLink, MainLayoutComponent],
  templateUrl: './high-risk-alerts.component.html',
  styleUrls: []
})
export class HighRiskAlertsComponent {
  getStatusBadgeClass = getStatusBadgeClass;

  private transactionService = inject(TransactionService);
  private refresh$ = new BehaviorSubject<void>(undefined);

  flaggedTransactions$ = this.refresh$.pipe(
    switchMap(() => this.transactionService.getFlaggedTransactions())
  );

  markAs(transaction: Transaction, status: string): void {
    this.transactionService.updateTransactionStatus(transaction.id, status).subscribe({
      next: () => this.refresh$.next(),
      error: (err) => console.error('Error updating transaction status:', err)
    });
  }
}

