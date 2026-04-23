import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, switchMap } from 'rxjs';
import { MainLayoutComponent } from '../../../shared/layouts/main-layout/main-layout.component';
import { TransactionListComponent } from '../../../shared/components/transaction-list/transaction-list.component';
import { TransactionService } from '../../../core/services';

@Component({
  selector: 'app-view-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, TransactionListComponent],
  templateUrl: './view-transactions.component.html',
})
export class ViewTransactionsComponent {
  private readonly transactionService = inject(TransactionService);
  private readonly router = inject(Router);

  searchQuery = '';
  private readonly search$ = new BehaviorSubject<string>('');

  transactions$ = this.search$.pipe(
    switchMap(query => this.transactionService.searchTransactions(query, 100))
  );

  onSearch(): void {
    this.search$.next(this.searchQuery);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.search$.next('');
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
