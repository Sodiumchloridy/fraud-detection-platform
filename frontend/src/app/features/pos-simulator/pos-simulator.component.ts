import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MainLayoutComponent } from '../../shared/layouts/main-layout/main-layout.component';
import { Transaction, getStatusBadgeClass } from '../../core/services';

interface TransactionRequestDto {
  cardNumber: string;
  amount: number;
  category: string;
  latitude: number;
  longitude: number;
  deviceId: string;
  merchant: string;
  timestamp: string;
}

interface SimulationResult {
  transaction: Transaction;
  timestamp: Date;
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
      deviceId: "renovo_pos_sim_123456"
    };

    this.http.post<Transaction>(`${this.apiUrl}/fraud-check`, request).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (transaction) => this.results.unshift({ transaction, timestamp: new Date() }),
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
}
