import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MainLayoutComponent } from '../../shared/layouts/main-layout/main-layout.component';
import { Transaction, getRiskLevel } from '../../core/services';

interface TransactionRequest {
  cc_number: string;
  amount: number;
  category: string;
  latitude: number;
  longitude: number;
}

interface SimulationResult {
  transaction: Transaction;
  timestamp: Date;
}

@Component({
  selector: 'app-pos-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MainLayoutComponent],
  templateUrl: './pos-simulator.component.html',
  styleUrls: []
})
export class PosSimulatorComponent {
  private apiUrl = 'http://localhost:8080/api/transactions';
  
  // Form fields
  ccNumber = 'user_001';
  amount = 50;
  category = 'grocery_pos';
  latitude = 40.7128;
  longitude = -74.006;
  
  // Preset locations for quick selection
  locations = [
    { name: 'New York, NY', lat: 40.7128, lon: -74.006 },
    { name: 'Los Angeles, CA', lat: 34.0522, lon: -118.2437 },
    { name: 'Chicago, IL', lat: 41.8781, lon: -87.6298 },
    { name: 'Houston, TX', lat: 29.7604, lon: -95.3698 },
    { name: 'London, UK', lat: 51.5074, lon: -0.1278 },
    { name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503 },
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
  
  // Simulation results
  results: SimulationResult[] = [];
  isLoading = false;
  error: string | null = null;
  
  // Helper
  getRiskLevel = getRiskLevel;
  
  constructor(private http: HttpClient) {}
  
  selectLocation(location: { name: string; lat: number; lon: number }) {
    this.latitude = location.lat;
    this.longitude = location.lon;
  }
  
  submitTransaction() {
    this.isLoading = true;
    this.error = null;
    
    const request: TransactionRequest = {
      cc_number: this.ccNumber,
      amount: this.amount,
      category: this.category,
      latitude: this.latitude,
      longitude: this.longitude
    };
    
    this.http.post<Transaction>(`${this.apiUrl}/fraud-check`, request).subscribe({
      next: (transaction) => {
        this.results.unshift({
          transaction,
          timestamp: new Date()
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to process transaction';
        this.isLoading = false;
      }
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
