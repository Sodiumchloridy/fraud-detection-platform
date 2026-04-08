import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FraudRule {
  id: string;
  name: string;
  description: string;
  feature: string;
  operator: string;
  threshold: number;
  penalty: number;
  override: boolean;
  enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RulesService {
  private apiUrl = 'http://localhost:8080/api/fraud-service/rules';
  private blocklistUrl = 'http://localhost:8080/api/fraud-service/blocklist';
  private allowlistUrl = 'http://localhost:8080/api/fraud-service/allowlist';

  constructor(private http: HttpClient) {}

  getRules(): Observable<FraudRule[]> {
    return this.http.get<FraudRule[]>(this.apiUrl);
  }

  updateRules(rules: FraudRule[]): Observable<FraudRule[]> {
    return this.http.put<FraudRule[]>(this.apiUrl, rules);
  }

  getBlocklist(): Observable<string[]> {
    return this.http.get<string[]>(this.blocklistUrl);
  }

  updateBlocklist(cards: string[]): Observable<string[]> {
    return this.http.put<string[]>(this.blocklistUrl, { cards });
  }

  getAllowlist(): Observable<string[]> {
    return this.http.get<string[]>(this.allowlistUrl);
  }

  updateAllowlist(cards: string[]): Observable<string[]> {
    return this.http.put<string[]>(this.allowlistUrl, { cards });
  }
}
