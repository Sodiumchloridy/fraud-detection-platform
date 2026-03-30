import { Injectable, NgZone } from '@angular/core';
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
    private apiUrl = 'http://localhost:8080/api/fraud-service/analyze';
    private chatUrl = 'http://localhost:8080/api/fraud-service/chat';

    constructor(private http: HttpClient, private ngZone: NgZone) {}

    analyzeTransaction(transaction: Transaction): Observable<{ reason: string }> {
        return this.http.post<{ reason: string }>(this.apiUrl, transaction);
    }

    /**
     * Streams chat tokens via SSE. Each emission is a text token.
     * Completes when the stream ends.
     */
    chatStream(messages: ChatMessage[], transaction?: Transaction | null): Observable<string> {
        const ngZone = this.ngZone;
        return new Observable(observer => {
            const token = localStorage.getItem('token');
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const body = JSON.stringify({
                messages,
                ...(transaction ? { transaction_context: transaction } : {})
            });

            const controller = new AbortController();

            fetch(this.chatUrl, {
                method: 'POST',
                headers,
                body,
                signal: controller.signal,
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    const reader = response.body!.getReader();
                    const decoder = new TextDecoder();
                    let buffer = '';

                    function pump(): Promise<void> {
                        return reader.read().then(({ done, value }) => {
                            if (done) {
                                ngZone.run(() => observer.complete());
                                return;
                            }
                            buffer += decoder.decode(value, { stream: true });
                            const lines = buffer.split('\n');
                            buffer = lines.pop()!;
                            for (const line of lines) {
                                if (line.startsWith('data: ')) {
                                    const data = line.slice(6).trim();
                                    if (data === '[DONE]') {
                                        ngZone.run(() => observer.complete());
                                        return;
                                    }
                                    try {
                                        const parsed = JSON.parse(data);
                                        if (parsed.token) {
                                            ngZone.run(() => observer.next(parsed.token));
                                        }
                                    } catch { /* skip malformed chunks */ }
                                }
                            }
                            return pump();
                        });
                    }

                    return pump();
                })
                .catch(err => {
                    if (err.name !== 'AbortError') {
                        ngZone.run(() => observer.error(err));
                    }
                });

            return () => controller.abort();
        });
    }
}
