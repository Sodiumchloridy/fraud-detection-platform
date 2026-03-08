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
  shapJson: string | null;
  status: string;

  /* Human Review */
  isFraud: number;
  reviewedBy: string;
  reviewedAt: string;
}

export function getStatusBadgeClass(status: string): string {
  switch (status?.toUpperCase()) {
    case 'BLOCKED':  return 'bg-rose-100 text-rose-700';
    case 'FLAGGED':  return 'bg-amber-100 text-amber-700';
    case 'APPROVED': return 'bg-emerald-100 text-emerald-700';
    default:         return 'bg-slate-100 text-slate-700';
  }
}

export interface ShapFeature {
  feature: string;
  label: string;
  shap_value: number;
  feature_value: number | string;
}

export interface ShapExplanation {
  base_value: number;
  shap_values: Record<string, number>;
  top_features: ShapFeature[];
}

export interface TransactionStats {
  total: number;
  approved: number;
  flagged: number;
  blocked: number;
}

export interface ThresholdConfig {
  blockedThreshold: number;
  flaggedThreshold: number;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = 'http://localhost:8080/api/transactions';

  constructor(private http: HttpClient, private zone: NgZone) { }

  getAllTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.apiUrl);
  }

  getTransactionById(id: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.apiUrl}/${id}`);
  }

  getFlaggedTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/flagged`);
  }

  getTransactionStats(): Observable<TransactionStats> {
    return this.http.get<TransactionStats>(`${this.apiUrl}/stats`);
  }

  updateTransactionStatus(id: string, status: string): Observable<Transaction> {
    return this.http.patch<Transaction>(`${this.apiUrl}/${id}/status?status=${status}`, {});
  }

  getThresholds(): Observable<ThresholdConfig> {
    return this.http.get<ThresholdConfig>('http://localhost:8080/api/thresholds');
  }

  updateThresholds(config: ThresholdConfig): Observable<ThresholdConfig> {
    return this.http.put<ThresholdConfig>('http://localhost:8080/api/thresholds', config);
  }
}
