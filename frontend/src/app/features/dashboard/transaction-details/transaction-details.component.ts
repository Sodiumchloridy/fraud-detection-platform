import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MainLayoutComponent } from '../../../shared/layouts/main-layout/main-layout.component';
import { TransactionService, Transaction } from '../../../core/services';

@Component({
  selector: 'app-transaction-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MainLayoutComponent],
  templateUrl: './transaction-details.component.html',
  styleUrls: []
})
export class TransactionDetailsComponent implements OnInit {
  transaction: Transaction | null = null;

  constructor(
    private route: ActivatedRoute,
    private transactionService: TransactionService
  ) {}

  ngOnInit() {
    const txnId = this.route.snapshot.paramMap.get('id');
    if (txnId) {
      this.loadTransaction(+txnId);
    }
  }

  loadTransaction(id: number) {
    this.transactionService.getTransactionById(id).subscribe({
      next: (data) => {
        this.transaction = data;
      },
      error: (err) => console.error('Error loading transaction:', err)
    });
  }

  markAs(status: string) {
    if (this.transaction) {
      this.transactionService.updateTransactionStatus(this.transaction.id, status).subscribe({
        next: () => {
          alert(`Transaction marked as: ${status}. Thank you for your feedback.`);
          this.loadTransaction(this.transaction!.id);
        },
        error: (err) => console.error('Error updating status:', err)
      });
    }
  }
}

