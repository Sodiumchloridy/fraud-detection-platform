import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transaction } from './transaction.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class LlmService {
    private apiUrl = 'http://localhost:8000/analyze-transaction';
    private chatUrl = 'http://localhost:8000/chat';

    constructor(private http: HttpClient) {}

    analyzeTransaction(transaction: Transaction): Observable<{ reason: string }> {
        return this.http.post<{ reason: string }>(this.apiUrl, transaction);
    }

    chat(messages: ChatMessage[], transaction?: Transaction | null): Observable<{ reply: string }> {
        return this.http.post<{ reply: string }>(this.chatUrl, {
            messages,
            ...(transaction ? { transaction_context: transaction } : {})
        });
    }
}
