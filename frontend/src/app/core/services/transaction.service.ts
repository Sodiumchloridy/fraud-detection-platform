import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Transaction {
  id: string;
  ccNumber: string;
  amount: number;
  category: string;
  timestamp: string;
  merchant: string;
  channel: string;

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

  /* System & Verdict */
  riskScore: number;
  status: string;

  /* Human Review */
  isFraud: number;
  reviewedBy: string;
  reviewedAt: string;
}

export function getRiskLevel(riskScore: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (riskScore >= 0.8) return 'HIGH';
  if (riskScore >= 0.5) return 'MEDIUM';
  return 'LOW';
}

export function getRiskBadgeClass(riskScore: number): string {
  const level = getRiskLevel(riskScore);
  if (level === 'HIGH') return 'bg-rose-100 text-rose-700';
  if (level === 'MEDIUM') return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
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

  constructor(private http: HttpClient, private zone: NgZone) { }

  // ── REST endpoints ──

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
