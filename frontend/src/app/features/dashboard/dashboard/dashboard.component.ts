import { Component, ChangeDetectionStrategy, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MainLayoutComponent } from '../../../shared/layouts/main-layout/main-layout.component';
import { TransactionService, Transaction, getStatusBadgeClass } from '../../../core/services';
import { Subscription, timer } from 'rxjs';
import { map, share, switchMap } from 'rxjs/operators';
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
  private sub?: Subscription;
  private refresh$ = timer(0, 2000).pipe(share());

  transactions$ = this.refresh$.pipe(
    switchMap(() => this.transactionService.getAllTransactions()),
    map(data => data
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    )
  );

  stats$ = this.refresh$.pipe(
    switchMap(() => this.transactionService.getTransactionStats()),
    share()
  );

  constructor(private transactionService: TransactionService) {}

  ngAfterViewInit(): void {
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
      ]},
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { color: '#f1f5f9' },
            ticks: { callback: v => '$' + Number(v).toLocaleString(), font: { size: 11 }, padding: 8 },
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
            callbacks: { label: ctx => ` ${ctx.dataset.label}: $${Number(ctx.raw).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
          },
        },
        animation: { duration: 400 },
      }
    });

    this.sub = this.transactions$.pipe(
      map(txns => this.buildTrend(txns))
    ).subscribe(trend => {
      if (!this.chart) return;
      this.chart.data.labels = trend.map(p => p.label);
      this.chart.data.datasets[0].data = trend.map(p => p.total);
      this.chart.data.datasets[1].data = trend.map(p => p.fraud);
      this.chart.update();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.chart?.destroy();
  }

  private buildTrend(txns: Transaction[]): { label: string; total: number; fraud: number }[] {
    const grouped = new Map<string, { total: number; fraud: number }>();
    for (const t of txns) {
      const min = t.timestamp?.slice(0, 16) ?? 'unknown';
      const entry = grouped.get(min) ?? { total: 0, fraud: 0 };
      entry.total += t.amount ?? 0;
      if (t.status === 'BLOCKED' || t.status === 'FLAGGED') entry.fraud += t.amount ?? 0;
      grouped.set(min, entry);
    }
    return [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([label, v]) => ({ label: label.slice(11, 16), ...v }));
  }
}

