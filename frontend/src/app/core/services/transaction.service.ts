import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Transaction {
  id: string;
  ccNum: string;
  amount: number;
  category: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  riskScore: number;
  status: string;
}

// Helper function to derive risk level from score
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

  createTransaction(transaction: Partial<Transaction>): Observable<Transaction> {
    return this.http.post<Transaction>(this.apiUrl, transaction);
  }

  updateTransactionStatus(id: string, status: string): Observable<Transaction> {
    return this.http.patch<Transaction>(`${this.apiUrl}/${id}/status?status=${status}`, {});
  }

  deleteTransaction(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ── SSE (Server-Sent Events) real-time stream ──

  /**
   * Connects to the backend SSE stream and emits new Transaction
   * objects as they arrive. Automatically reconnects on error.
   */
  streamTransactions(): Observable<Transaction> {
    return new Observable<Transaction>(observer => {
      const eventSource = new EventSource(`${this.apiUrl}/stream`);

      eventSource.addEventListener('transaction', (event: MessageEvent) => {
        this.zone.run(() => {
          try {
            const transaction: Transaction = JSON.parse(event.data);
            observer.next(transaction);
          } catch (e) {
            console.error('Failed to parse transaction SSE event', e);
          }
        });
      });

      eventSource.onerror = () => {
        // EventSource auto-reconnects on error; we just log it
        console.warn('SSE connection error — browser will auto-reconnect');
      };

      // Cleanup when the observable is unsubscribed
      return () => {
        eventSource.close();
      };
    });
  }

  /**
   * Connects to the backend SSE stream and emits TransactionStats
   * updates as they arrive.
   */
  streamStats(): Observable<TransactionStats> {
    return new Observable<TransactionStats>(observer => {
      const eventSource = new EventSource(`${this.apiUrl}/stream`);

      eventSource.addEventListener('stats', (event: MessageEvent) => {
        this.zone.run(() => {
          try {
            const stats: TransactionStats = JSON.parse(event.data);
            observer.next(stats);
          } catch (e) {
            console.error('Failed to parse stats SSE event', e);
          }
        });
      });

      eventSource.onerror = () => {
        console.warn('SSE stats connection error — browser will auto-reconnect');
      };

      return () => {
        eventSource.close();
      };
    });
  }
}
