import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, switchMap, combineLatest, map } from 'rxjs';
import { MainLayoutComponent } from '../../../shared/layouts/main-layout/main-layout.component';
import { TransactionListComponent } from '../../../shared/components/transaction-list/transaction-list.component';
import { TransactionService, Transaction, getStatusBadgeClass } from '../../../core/services';

@Component({
  selector: 'app-flagged-transactions',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent, TransactionListComponent],
  templateUrl: './flagged-transactions.component.html',
  styleUrls: []
})
export class FlaggedTransactionsComponent {
  getStatusBadgeClass = getStatusBadgeClass;
  emptySet = new Set<string>();

  private transactionService = inject(TransactionService);
  private router = inject(Router);
  private refresh$ = new BehaviorSubject<void>(undefined);

  flaggedTransactions$ = this.refresh$.pipe(
    switchMap(() => this.transactionService.getFlaggedTransactions())
  );

  readIds$ = this.transactionService.readIds$;

  onTransactionClick(transaction: Transaction): void {
    this.transactionService.markAsRead(transaction.id);
  }

  markAs(transaction: Transaction, status: string): void {
    this.transactionService.updateTransactionStatus(transaction.id, status).subscribe({
      next: () => this.refresh$.next(),
      error: (err) => console.error('Error updating transaction status:', err)
    });
  }

  goBack() { this.router.navigate(['/dashboard']); }
}

