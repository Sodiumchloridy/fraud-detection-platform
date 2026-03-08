import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../../shared/layouts/main-layout/main-layout.component';
import { TransactionService, Transaction, getStatusBadgeClass, ShapExplanation } from '../../../core/services';
import { LlmService } from '../../../core/services/llm.service';

@Component({
  selector: 'app-transaction-details',
  standalone: true,
  imports: [CommonModule, RouterLink, MainLayoutComponent],
  templateUrl: './transaction-details.component.html',
  styleUrls: []
})
export class TransactionDetailsComponent implements OnInit {
  transaction: Transaction | null = null;
  locationName: string | null = null;
  analysisReason: string | null = null;
  shapExplanation: ShapExplanation | null = null;
  getStatusBadgeClass = getStatusBadgeClass;

  constructor(
    private route: ActivatedRoute,
    private transactionService: TransactionService,
    private http: HttpClient,
    private llmService: LlmService
  ) {}

  ngOnInit() {
    const txnId = this.route.snapshot.paramMap.get('id');
    if (txnId) {
      this.loadTransaction(txnId);
    }
  }

  loadTransaction(id: string) {
    this.transactionService.getTransactionById(id).subscribe({
      next: async (data) => {
        this.transaction = data;
        if (data.latitude && data.longitude) {
          this.fetchLocationName(data.latitude, data.longitude);
        }
        this.analysisReason = (data.riskScore && data.status !== 'APPROVED')
          ? await this.getAnalysisReason()
          : null;
        this.shapExplanation = data.shapJson ? JSON.parse(data.shapJson) : null;
      },
      error: (err) => console.error('Error loading transaction:', err)
    });
  }

  fetchLocationName(lat: number, lon: number) {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&zoom=12&accept-language=en-US,en&format=jsonv2`;
    this.http.get<{ display_name?: string; error?: string }>(url).subscribe({
      next: (res) => this.locationName = (res.display_name && !res.error) ? res.display_name : `${lat}, ${lon}`,
      error: () => this.locationName = `${lat}, ${lon}`
    });
  }

  markAs(status: string) {
    if (!this.transaction) return;
    this.transactionService.updateTransactionStatus(this.transaction.id, status).subscribe({
      next: () => this.loadTransaction(this.transaction!.id),
      error: (err) => console.error('Error updating status:', err)
    });
  }

  async getAnalysisReason(): Promise<string> {
    if (!this.transaction) return 'Loading analysis...';
    return firstValueFrom(this.llmService.analyzeTransaction(this.transaction))
      .then(r => r?.reason?.trim() || 'No analysis available')
      .catch(() => 'Error loading analysis');
  }

  get maxShapAbsValue(): number {
    if (!this.shapExplanation?.top_features?.length) return 1;
    return Math.max(...this.shapExplanation.top_features.map(f => Math.abs(f.shap_value)));
  }

  shapBarWidth(value: number): number {
    return this.maxShapAbsValue > 0 ? (Math.abs(value) / this.maxShapAbsValue) * 100 : 0;
  }
}

