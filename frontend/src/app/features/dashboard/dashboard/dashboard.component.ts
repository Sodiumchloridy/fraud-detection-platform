import { Component, ChangeDetectionStrategy, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MainLayoutComponent } from '../../../shared/layouts/main-layout/main-layout.component';
import { TransactionService, Transaction, TransactionStats, getStatusBadgeClass } from '../../../core/services';
import { UserService } from '../../../core/services/user.service';
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

  showPwToast = false;
  private toastTimer?: ReturnType<typeof setTimeout>;

  readonly timeWindows = [
    { label: '15s', seconds: 15,  bucketMs: 1_000 },
    { label: '30s', seconds: 30,  bucketMs: 2_000 },
    { label: '1m',  seconds: 60,  bucketMs: 5_000 },
    { label: '5m',  seconds: 300, bucketMs: 20_000 },
  ];
  selectedWindow = this.timeWindows[2]; // default 1 minute

  private chart?: Chart;
  private sseSub?: Subscription;

  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  transactions$ = this.transactionsSubject.asObservable();

  private statsSubject = new BehaviorSubject<TransactionStats | null>(null);
  stats$ = this.statsSubject.asObservable();

  constructor(
    private transactionService: TransactionService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    if (this.userService.getCurrentUser()?.promptChangePassword) {
      this.showPwToast = true;
      this.toastTimer = setTimeout(() => { this.showPwToast = false; this.cdr.markForCheck(); }, 8000);
    }
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
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  setWindow(w: typeof this.timeWindows[0]): void {
    this.selectedWindow = w;
    this.updateChart();
    this.cdr.markForCheck();
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
    if (!txns.length) return [];
    const { seconds, bucketMs } = this.selectedWindow;
    const maxTime = Math.max(...txns.map(t => new Date(t.timestamp).getTime()));
    const minTime = maxTime - seconds * 1000;
    const filtered = txns.filter(t => {
      const ts = new Date(t.timestamp).getTime();
      return ts >= minTime && ts <= maxTime;
    });
    const grouped = new Map<number, { total: number; fraud: number; flagged: number }>();
    for (const t of filtered) {
      const ts = new Date(t.timestamp).getTime();
      const bucket = Math.floor(ts / bucketMs) * bucketMs;
      const entry = grouped.get(bucket) ?? { total: 0, fraud: 0, flagged: 0 };
      entry.total += t.amount ?? 0;
      if (t.status === 'BLOCKED') entry.fraud += t.amount ?? 0;
      if (t.status === 'FLAGGED') entry.flagged += t.amount ?? 0;
      grouped.set(bucket, entry);
    }
    return [...grouped.entries()]
      .sort(([a], [b]) => a - b)
      .map(([ts, v]) => {
        const d = new Date(ts);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const ss = String(d.getSeconds()).padStart(2, '0');
        const label = seconds <= 60 ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
        return { label, ...v };
      });
  }
}

