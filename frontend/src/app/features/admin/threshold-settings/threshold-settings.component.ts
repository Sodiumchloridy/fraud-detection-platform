import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TransactionService, ThresholdConfig } from '../../../core/services';

@Component({
  selector: 'app-threshold-settings',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './threshold-settings.component.html',
})
export class ThresholdSettingsComponent implements OnInit {
  flaggedThreshold = 50;
  blockedThreshold = 80;
  loading = true;
  saving = false;
  saved = false;
  error: string | null = null;

  constructor(private transactionService: TransactionService) {}

  ngOnInit() {
    this.transactionService.getThresholds().subscribe({
      next: (config) => {
        this.flaggedThreshold = Math.round(config.flaggedThreshold * 100);
        this.blockedThreshold = Math.round(config.blockedThreshold * 100);
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load current thresholds';
        this.loading = false;
      }
    });
  }

  onFlaggedChange(value: number) {
    this.flaggedThreshold = value;
    if (this.blockedThreshold <= value) {
      this.blockedThreshold = Math.min(value + 1, 100);
    }
  }

  onBlockedChange(value: number) {
    this.blockedThreshold = value;
    if (this.flaggedThreshold >= value) {
      this.flaggedThreshold = Math.max(value - 1, 0);
    }
  }

  save() {
    this.saving = true;
    this.saved = false;
    this.error = null;

    const config: ThresholdConfig = {
      flaggedThreshold: this.flaggedThreshold / 100,
      blockedThreshold: this.blockedThreshold / 100,
    };

    this.transactionService.updateThresholds(config).subscribe({
      next: () => {
        this.saving = false;
        this.saved = true;
        setTimeout(() => this.saved = false, 3000);
      },
      error: () => {
        this.saving = false;
        this.error = 'Failed to save thresholds. Ensure flagged < blocked.';
      }
    });
  }
}
