import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MainLayoutComponent } from '../../../shared/layouts/main-layout/main-layout.component';
import { TransactionService, Transaction, TransactionStats, getRiskLevel } from '../../../core/services';
import { timer } from 'rxjs';
import { map, share, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MainLayoutComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  getRiskLevel = getRiskLevel;

  private refresh$ = timer(0, 1000).pipe(share());

  transactions$ = this.refresh$.pipe(
    switchMap(() => this.transactionService.getAllTransactions()),
    map(data => data
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20)
    )
  );

  stats$ = this.refresh$.pipe(
    switchMap(() => this.transactionService.getTransactionStats()),
    share()
  );

  constructor(private transactionService: TransactionService) {}

  trackByTransactionId(index: number, transaction: Transaction): string {
    return transaction.id;
  }
}

