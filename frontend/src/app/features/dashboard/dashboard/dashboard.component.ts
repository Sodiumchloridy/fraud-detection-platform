import { Component, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MainLayoutComponent } from '../../../shared/layouts/main-layout/main-layout.component';
import { TransactionService, getRiskLevel } from '../../../core/services';
import { timer } from 'rxjs';
import { map, share, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MainLayoutComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnDestroy {
  getRiskLevel = getRiskLevel;

  private refresh$ = timer(0, 2000).pipe(share());

  transactions$ = this.refresh$.pipe(
    switchMap(() => this.transactionService.getAllTransactions()),
    map(data => data
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    )
  );

  stats$ = this.refresh$.pipe(
    switchMap(() => this.transactionService.getTransactionStats()),
    share()
  );

  constructor(private transactionService: TransactionService) {}

  ngOnDestroy(): void {
    // any cleanup logic if needed
  }
}

