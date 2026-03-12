import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Transaction {
  id: string;
  cardNumber: string;
  amount: number;
  category: string;
  timestamp: string;
  merchant: string;
  channel: string;

  /* Location */
  latitude: number;
  longitude: number;

  /* Fraud Features */
  fAmountZscore: number;
  fAmountToAvgRatio: number;
  fTravelVelocityKmh: number;
  fTravelDistanceKm: number;
  fTxnCount1h: number;
  fTxnCount24h: number;
  fTxnCount7d: number;
  fSecondsSinceLastTxn: number;
  fHourOfDay: number;
  fIsNewDevice: number;
  fIsNewMerchant: number;

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
  shapValue: number;
  featureValue: number | string;
}

export interface ShapExplanation {
  baseValue: number;
  shapValues: Record<string, number>;
  topFeatures: ShapFeature[];
}

export interface TransactionStats {
  total: number;
  approved: number;
  flagged: number;
  blocked: number;
  fraudRate: number;
  approvalRate: number;
  totalVolume: number;
  avgAmount: number;
  amountAtRisk: number;
  blockedAmount: number;
  pendingReview: number;
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
