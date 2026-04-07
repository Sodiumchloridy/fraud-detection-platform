import { Component, ChangeDetectionStrategy, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MainLayoutComponent } from '../../../shared/layouts/main-layout/main-layout.component';
import { TransactionService, Transaction, TransactionStats, getStatusBadgeClass } from '../../../core/services';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);
Chart.defaults.font.family = "'Inter', system-ui, -apple-system, sans-serif";
Chart.defaults.color = '#94a3b8'; // slate-400

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MainLayoutComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  getStatusBadgeClass = getStatusBadgeClass;
  @ViewChild('trendCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;
  private sseSub?: Subscription;

  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  transactions$ = this.transactionsSubject.asObservable();

  private statsSubject = new BehaviorSubject<TransactionStats | null>(null);
  stats$ = this.statsSubject.asObservable();

  constructor(
    private transactionService: TransactionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    // 1. Initial load via HTTP
    this.transactionService.getAllTransactions().subscribe(data => {
      this.transactionsSubject.next(
        data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      );
      this.updateChart();
    });
    this.transactionService.getTransactionStats().subscribe(stats => {
      this.statsSubject.next(stats);
      this.cdr.markForCheck();
    });

    // 2. Connect to SSE for real-time updates
    this.sseSub = this.transactionService.streamTransactions().subscribe(txn => {
      const current = this.transactionsSubject.value;
      const idx = current.findIndex(t => t.id === txn.id);
      const updated = idx >= 0 ? current.map(t => t.id === txn.id ? txn : t) : [txn, ...current];
      this.transactionsSubject.next(updated.sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)));
      this.updateChart();
      this.transactionService.getTransactionStats().subscribe(s => { this.statsSubject.next(s); this.cdr.markForCheck(); });
    });

    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'line',
      data: { labels: [], datasets: [
        {
          label: 'Total $', data: [],
          borderColor: '#818cf8', backgroundColor: 'rgba(99,102,241,.08)',
          fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 5,
          pointHoverBackgroundColor: '#818cf8', pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2,
          borderWidth: 2,
        },
        {
          label: 'Fraud $', data: [],
          borderColor: '#f43f5e', backgroundColor: 'rgba(244,63,94,.06)',
          fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 5,
          pointHoverBackgroundColor: '#f43f5e', pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2,
          borderWidth: 2,
        },
        {
          label: 'Flagged $', data: [],
          borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,.06)',
          fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 5,
          pointHoverBackgroundColor: '#f59e0b', pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2,
          borderWidth: 2,
        },
      ]},
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { color: '#f1f5f9' },
            ticks: { callback: (v: number | string) => '$' + Number(v).toLocaleString(), font: { size: 11 }, padding: 8 },
          },
          x: {
            border: { display: false },
            grid: { display: false },
            ticks: { font: { size: 11 }, maxRotation: 0 },
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b', titleColor: '#e2e8f0', bodyColor: '#e2e8f0',
            padding: 10, cornerRadius: 8, titleFont: { size: 11 }, bodyFont: { size: 12 },
            callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: $${Number(ctx.raw).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
          },
        },
        animation: { duration: 400 },
      }
    });
  }

  ngOnDestroy(): void {
    this.sseSub?.unsubscribe();
    this.chart?.destroy();
  }

  private updateChart(): void {
    if (!this.chart) return;
    const trend = this.buildTrend(this.transactionsSubject.value);
    this.chart.data.labels = trend.map(p => p.label);
    this.chart.data.datasets[0].data = trend.map(p => p.total);
    this.chart.data.datasets[1].data = trend.map(p => p.fraud);
    this.chart.data.datasets[2].data = trend.map(p => p.flagged);
    this.chart.update();
  }

  private buildTrend(txns: Transaction[]): { label: string; total: number; fraud: number; flagged: number }[] {
    const grouped = new Map<string, { total: number; fraud: number; flagged: number }>();
    for (const t of txns) {
      const min = t.timestamp?.slice(0, 16) ?? 'unknown';
      const entry = grouped.get(min) ?? { total: 0, fraud: 0, flagged: 0 };
      entry.total += t.amount ?? 0;
      if (t.status === 'BLOCKED') entry.fraud += t.amount ?? 0;
      if (t.status === 'FLAGGED') entry.flagged += t.amount ?? 0;
      grouped.set(min, entry);
    }
    return [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([label, v]) => ({ label: label.slice(11, 16), ...v }));
  }
}

