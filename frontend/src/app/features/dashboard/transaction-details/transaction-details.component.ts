import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MainLayoutComponent } from '../../../shared/layouts/main-layout/main-layout.component';
import { TransactionService, Transaction, getRiskLevel } from '../../../core/services';

@Component({
  selector: 'app-transaction-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MainLayoutComponent],
  templateUrl: './transaction-details.component.html',
  styleUrls: []
})
export class TransactionDetailsComponent implements OnInit {
  transaction: Transaction | null = null;
  locationName: string | null = null;
  getRiskLevel = getRiskLevel;

  constructor(
    private route: ActivatedRoute,
    private transactionService: TransactionService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const txnId = this.route.snapshot.paramMap.get('id');
    if (txnId) {
      this.loadTransaction(txnId);
    }
  }

  loadTransaction(id: string) {
    this.transactionService.getTransactionById(id).subscribe({
      next: (data) => {
        this.transaction = data;
        this.fetchLocationName(data.latitude, data.longitude);
      },
      error: (err) => console.error('Error loading transaction:', err)
    });
  }

  fetchLocationName(lat: number, lon: number) {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&zoom=12&accept-language=en-US,en&format=jsonv2`;
    this.http.get<{ display_name?: string; error?: string }>(url).subscribe({
      next: (res) => this.locationName = (res.display_name && !res.error) ? res.display_name : `${lat}, ${lon}`,
      error: () => this.locationName = `${lat}, ${lon}`
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

