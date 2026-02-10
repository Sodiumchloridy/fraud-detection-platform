import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Transaction {
  id: string;
  ccNumber: string;
  amount: number;
  category: string;
  timestamp: string;
  merchant: string;
  f_channel: string;

  /* Location */
  latitude: number;
  longitude: number;

  /* Fraud Features */
  f_amount_zscore: number;
  f_amount_to_avg_ratio: number;
  f_travel_velocity_kmh: number;
  f_travel_distance_km: number;
  f_txn_count_1h: number;
  f_txn_count_24h: number;
  f_txn_count_7d: number;
  f_seconds_since_last_txn: number;
  f_hour_of_day: number;
  f_is_new_device: number;
  f_is_new_merchant: number;

  /* Verdict */
  riskScore: number;
  status: string;
}

export function getRiskLevel(riskScore: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (riskScore >= 0.7) return 'HIGH';
  if (riskScore >= 0.4) return 'MEDIUM';
  return 'LOW';
}

export interface TransactionStats {
  total: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  critical: number;
  flagged: number;
  blocked: number;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = 'http://localhost:8080/api/transactions';

  constructor(private http: HttpClient) { }

  getAllTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.apiUrl);
  }

  getTransactionById(id: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.apiUrl}/${id}`);
  }

  getHighRiskTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/high-risk`);
  }

  getTransactionStats(): Observable<TransactionStats> {
    return this.http.get<TransactionStats>(`${this.apiUrl}/stats`);
  }

  updateTransactionStatus(id: string, status: string): Observable<Transaction> {
    return this.http.patch<Transaction>(`${this.apiUrl}/${id}/status?status=${status}`, {});
  }
}
