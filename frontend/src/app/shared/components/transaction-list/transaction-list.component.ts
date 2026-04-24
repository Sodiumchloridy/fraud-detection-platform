import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Transaction, getStatusBadgeClass } from '../../../core/services/transaction.service';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './transaction-list.component.html',
})
export class TransactionListComponent {
  @Input() transactions: Transaction[] = [];
  @Input() emptyMessage = 'No transactions found';
  @Input() animateRows = false;
  @Input() readIds: Set<string> = new Set();
  @Output() itemClick = new EventEmitter<Transaction>();

  getStatusBadgeClass = getStatusBadgeClass;
}
