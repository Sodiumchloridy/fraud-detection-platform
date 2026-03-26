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

  /* Entity Data */
  cardNetwork: string;
  cardType: string;
  cardIssuingCountry: number;
  billingCountryCode: number;
  billingZipCode: number;
  purchaserEmailDomain: string;
  recipientEmailDomain: string;
  deviceType: string;
  deviceInfo: string;

  /* Fraud Features */
  amountZscore: number;
  amountToAvgRatio: number;
  txnCount1h: number;
  txnCount24h: number;
  txnCount7d: number;
  secondsSinceLastTxn: number;
  hourOfDay: number;
  billingCountryMismatch: number;
  isRiskyEmail: number;
  emailDomainMismatch: number;
  isNewEmail: number;
  isNewDevice: number;
  isNewMerchant: number;

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

  streamTransactions(token: string): Observable<Transaction> {
    return new Observable(observer => {
      const url = `${this.apiUrl}/stream`;
      let cancelled = false;

      const connect = async () => {
        while (!cancelled) {
          try {
            const res = await fetch(url, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok || !res.body) { observer.error(new Error(`SSE ${res.status}`)); return; }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let eventName = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done || cancelled) break;
              buffer += decoder.decode(value, { stream: true });

              const lines = buffer.split('\n');
              buffer = lines.pop()!;
              for (const line of lines) {
                if (line.startsWith('event:')) eventName = line.slice(6).trim();
                else if (line.startsWith('data:') && eventName === 'transaction') {
                  this.zone.run(() => observer.next(JSON.parse(line.slice(5))));
                  eventName = '';
                }
              }
            }
          } catch {
            if (!cancelled) await new Promise(r => setTimeout(r, 3000)); // reconnect after 3s
          }
        }
      };
      connect();

      return () => { cancelled = true; };
    });
  }
}
