import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MainLayoutComponent } from '../../shared/layouts/main-layout/main-layout.component';
import { Transaction, TransactionService, getStatusBadgeClass } from '../../core/services';

interface TransactionRequestDto {
  cardNumber: string;
  amount: number;
  category: string;
  latitude: number;
  longitude: number;
  merchant: string;
  timestamp: string;
  cardNetwork: string;
  cardType: string;
  cardIssuingCountry: number;
  billingCountryCode: number;
  billingZipCode: number;
  purchaserEmailDomain: string | null;
  recipientEmailDomain: string | null;
  deviceType: string | null;
  deviceInfo: string;
}

interface SimulationResult {
  transaction: Transaction;
  timestamp: Date;
}

interface BlockedNotification {
  transaction: Transaction;
  id: number;
}

@Component({
  selector: 'app-pos-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MainLayoutComponent],
  templateUrl: './pos-simulator.component.html',
  styleUrls: []
})
export class PosSimulatorComponent {
  private apiUrl = 'http://localhost:8080/api/transactions';
  transactionService = inject(TransactionService);
  sseSub: Subscription | undefined = undefined;

  // Form fields
  cardNumber = 'user_001';
  merchant = 'Gerbang Alaf Restaurants Sdn Bhd';
  amount = 25;
  category = 'grocery_pos';
  latitude = 3.1390;
  longitude = 101.6869;
  selectedLocation: string | null = 'Kuala Lumpur, Malaysia';
  results: SimulationResult[] = [];
  isLoading = false;
  error: string | null = null;

  // Notification state
  flaggedTransaction: Transaction | null = null;
  blockedNotifications: BlockedNotification[] = [];
  private notificationCounter = 0;

  // Preset locations for quick selection
  locations = [
    { name: 'New York, NY', lat: 40.7128, lon: -74.006 },
    { name: 'London, UK', lat: 51.5074, lon: -0.1278 },
    { name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503 },
    { name: 'Kuala Lumpur, Malaysia', lat: 3.1390, lon: 101.6869 },
  ];

  // Transaction categories matching the model
  categories = [
    'grocery_pos',
    'gas_transport',
    'home',
    'shopping_pos',
    'kids_pets',
    'shopping_net',
    'entertainment',
    'food_dining',
    'personal_care',
    'health_fitness',
    'misc_pos',
    'misc_net',
    'grocery_net',
    'travel'
  ];

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.error = 'Authentication token is missing';
      return;
    }

    this.sseSub = this.transactionService.streamTransactions(token).subscribe(txn => {
      const idx = this.results.findIndex(r => r.transaction.id === txn.id);
      if (idx >= 0) {
        const prev = this.results[idx].transaction;
        this.results[idx] = { ...this.results[idx], transaction: txn };
        // Show notification if status changed via SSE
        if (prev.status !== txn.status) this.showNotificationForStatus(txn);
      }
    });
  }

  ngOnDestroy() {
    this.sseSub?.unsubscribe();
  }

  // Helper
  getStatusBadgeClass = getStatusBadgeClass;

  constructor(private http: HttpClient) { }

  selectLocation({ name, lat, lon }: { name: string; lat: number; lon: number }) {
    this.selectedLocation = name;
    [this.latitude, this.longitude] = [lat, lon];
  }

  submitTransaction() {
    this.isLoading = true;
    this.error = null;

    const request: TransactionRequestDto = {
      cardNumber: this.cardNumber,
      merchant: this.merchant,
      amount: this.amount,
      category: this.category,
      latitude: this.latitude,
      longitude: this.longitude,
      timestamp: new Date().toISOString(),
      cardNetwork: 'visa',
      cardType: 'debit',
      cardIssuingCountry: 458,
      billingCountryCode: 458,
      billingZipCode: 52000,
      purchaserEmailDomain: '',
      recipientEmailDomain: '',
      deviceType: null,
      deviceInfo: 'POS Simulator v1.0',
    };

    this.http.post<Transaction>(`${this.apiUrl}/fraud-check`, request).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (transaction) => {
        this.results.unshift({ transaction, timestamp: new Date() });
        this.showNotificationForStatus(transaction);
      },
      error: (err) => this.error = err.error?.message || 'Failed to process transaction'
    });
  }

  simulateRapidBurst() {
    // Simulate 5 rapid transactions (fraud pattern)
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.amount = Math.floor(Math.random() * 500) + 50;
        this.submitTransaction();
      }, i * 500);
    }
  }

  simulateVelocityAttack() {
    // Simulate transactions from different locations rapidly
    const farLocations = [
      { lat: 40.7128, lon: -74.006 },   // New York
      { lat: 51.5074, lon: -0.1278 },   // London (impossible travel)
      { lat: 35.6762, lon: 139.6503 },  // Tokyo (impossible travel)
    ];

    farLocations.forEach((loc, i) => {
      setTimeout(() => {
        this.latitude = loc.lat;
        this.longitude = loc.lon;
        this.amount = Math.floor(Math.random() * 1000) + 100;
        this.submitTransaction();
      }, i * 1000);
    });
  }

  clearResults() {
    this.results = [];
  }

  // --- Notification helpers ---

  private showNotificationForStatus(txn: Transaction) {
    const status = txn.status?.toUpperCase();
    if (status === 'FLAGGED') {
      this.flaggedTransaction = txn;
    } else if (status === 'BLOCKED') {
      this.addBlockedNotification(txn);
    }
  }

  private addBlockedNotification(txn: Transaction) {
    const note: BlockedNotification = { transaction: txn, id: ++this.notificationCounter };
    this.blockedNotifications.push(note);
    setTimeout(() => this.dismissBlockedNotification(note.id), 6000);
  }

  dismissBlockedNotification(id: number) {
    this.blockedNotifications = this.blockedNotifications.filter(n => n.id !== id);
  }

  reviewFlagged(status: 'APPROVED' | 'BLOCKED') {
    if (!this.flaggedTransaction) return;
    const txn = this.flaggedTransaction;
    this.flaggedTransaction = null;
    this.transactionService.updateTransactionStatus(txn.id, status).subscribe({
      next: (updated) => {
        const idx = this.results.findIndex(r => r.transaction.id === updated.id);
        if (idx >= 0) this.results[idx] = { ...this.results[idx], transaction: updated };
      },
      error: () => this.error = `Failed to ${status.toLowerCase()} transaction`
    });
  }

  dismissFlagged() {
    this.flaggedTransaction = null;
  }
}
