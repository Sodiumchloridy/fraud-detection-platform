import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transaction } from './transaction.service';

@Injectable({
  providedIn: 'root'
})
export class LlmService {
    private apiUrl = 'http://localhost:8000/analyze-transaction';

    constructor(private http: HttpClient) {}

    analyzeTransaction(transaction: Transaction): Observable<{ reason: string }> {
        return this.http.post<{ reason: string }>(this.apiUrl, transaction);
    }
}
