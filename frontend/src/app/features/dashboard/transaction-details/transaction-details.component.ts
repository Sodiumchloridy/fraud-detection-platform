import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../../shared/layouts/main-layout/main-layout.component';
import { TransactionService, Transaction, getStatusBadgeClass, ShapExplanation, ThresholdConfig } from '../../../core/services';
import { LlmService } from '../../../core/services/llm.service';

interface WaterfallStep {
  label: string;
  shapValue: number;
  startValue: number;
  endValue: number;
  isRuleStep?: boolean;
}

interface WaterfallData {
  steps: WaterfallStep[];
  baseValue: number;
  finalValue: number;
  scaleMin: number;
  scaleMax: number;
}

@Component({
  selector: 'app-transaction-details',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent, FormsModule],
  templateUrl: './transaction-details.component.html',
  styleUrls: []
})
export class TransactionDetailsComponent implements OnInit {
  transaction: Transaction | null = null;
  locationName: string | null = null;
  analysisReason: string | null = null;
  shapExplanation: ShapExplanation | null = null;
  waterfallData: WaterfallData | null = null;
  thresholds: ThresholdConfig | null = null;
  mapUrl: SafeResourceUrl | null = null;
  reviewReason = '';
  getStatusBadgeClass = getStatusBadgeClass;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly transactionService: TransactionService,
    private readonly http: HttpClient,
    private readonly llmService: LlmService,
    private readonly location: Location,
    private readonly sanitizer: DomSanitizer
  ) {}

  goBack() { this.location.back(); }

  ngOnInit() {
    const txnId = this.route.snapshot.paramMap.get('id');
    if (txnId) {
      this.loadTransaction(txnId);
    }
    this.transactionService.getThresholds().subscribe({
      next: (t) => this.thresholds = t,
    });
  }

  loadTransaction(id: string) {
    this.transactionService.getTransactionById(id).subscribe({
      next: async (data) => {
        this.transaction = data;
        if (data.latitude && data.longitude) {
          this.fetchLocationName(data.latitude, data.longitude);
          this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
            `https://maps.google.com/maps?q=${data.latitude},${data.longitude}&z=15&t=k&output=embed`
          );
        }
        this.analysisReason = (data.riskScore && data.status !== 'APPROVED')
          ? await this.getAnalysisReason()
          : null;
        this.shapExplanation = data.shapJson ? JSON.parse(data.shapJson) : null;
        this.waterfallData = this.computeWaterfall();
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

  markAs(status: string, isFraud?: number) {
    if (!this.transaction) return;
    const reason = this.reviewReason.trim() || undefined;
    this.transactionService.updateTransactionStatus(this.transaction.id, status, isFraud, reason).subscribe({
      next: () => {
        this.reviewReason = '';
        this.loadTransaction(this.transaction!.id);
      },
      error: (err) => console.error('Error updating status:', err)
    });
  }

  async getAnalysisReason(): Promise<string> {
    if (!this.transaction) return 'Loading analysis...';
    return firstValueFrom(this.llmService.analyzeTransaction(this.transaction))
      .then(r => r?.reason?.trim() || 'No analysis available')
      .catch(() => 'Error loading analysis');
  }

  private computeWaterfall(): WaterfallData | null {
    if (!this.shapExplanation?.topFeatures?.length) return null;

    const features = this.shapExplanation.topFeatures;
    const positive = features.filter(f => f.shapValue >= 0).sort((a, b) => b.shapValue - a.shapValue);
    const negative = features.filter(f => f.shapValue < 0).sort((a, b) => a.shapValue - b.shapValue);
    const sorted = [...positive, ...negative];

    const allShapSum = Object.values(this.shapExplanation.shapValues).reduce((s, v) => s + v, 0);
    const topShapSum = features.reduce((s, f) => s + f.shapValue, 0);
    const otherShap = allShapSum - topShapSum;

    const base = this.shapExplanation.baseValue;
    let running = base;
    const steps: WaterfallStep[] = [];

    for (const f of sorted) {
      const start = running;
      running += f.shapValue;
      steps.push({ label: f.label, shapValue: f.shapValue, startValue: start, endValue: running });
    }

    if (Math.abs(otherShap) > 0.0005) {
      const start = running;
      running += otherShap;
      steps.push({ label: 'Other features', shapValue: otherShap, startValue: start, endValue: running });
    }

    // Add a rules adjustment step if the final riskScore differs from the ML prediction
    const riskScore = this.transaction?.riskScore;
    if (riskScore != null) {
      const rulesAdj = riskScore - running;
      if (Math.abs(rulesAdj) > 0.001) {
        const start = running;
        running += rulesAdj;
        steps.push({ label: 'Rules adjustment', shapValue: rulesAdj, startValue: start, endValue: running, isRuleStep: true });
      }
    }

    return {
      steps,
      baseValue: base,
      finalValue: running,
      scaleMin: 0,
      scaleMax: 1,
    };
  }

  waterfallPct(value: number): number {
    if (!this.waterfallData) return 0;
    const { scaleMin, scaleMax } = this.waterfallData;
    return ((value - scaleMin) / (scaleMax - scaleMin)) * 100;
  }
}

