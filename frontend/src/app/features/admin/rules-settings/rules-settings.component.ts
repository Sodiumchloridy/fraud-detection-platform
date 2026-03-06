import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RulesService, FraudRule } from '../../../core/services';

@Component({
  selector: 'app-rules-settings',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './rules-settings.component.html',
})
export class RulesSettingsComponent implements OnInit {
  rules: FraudRule[] = [];
  loading = true;
  saving = false;
  saved = false;
  error: string | null = null;

  readonly operators = ['>', '>=', '<', '<=', '=='];

  readonly featureOptions = [
    { value: 'f_travel_velocity_kmh', label: 'Travel Velocity (km/h)' },
    { value: 'f_amount_zscore', label: 'Amount Z-Score' },
    { value: 'f_amount_to_avg_ratio', label: 'Amount / Average Ratio' },
    { value: 'f_txn_count_1h', label: 'Transactions in 1 Hour' },
    { value: 'f_txn_count_24h', label: 'Transactions in 24 Hours' },
    { value: 'f_txn_count_7d', label: 'Transactions in 7 Days' },
    { value: 'f_seconds_since_last_txn', label: 'Seconds Since Last Txn' },
    { value: 'f_hour_of_day', label: 'Hour of Day' },
    { value: 'f_is_new_device', label: 'Is New Device (0/1)' },
    { value: 'f_is_new_merchant', label: 'Is New Merchant (0/1)' },
    { value: 'f_travel_distance_km', label: 'Travel Distance (km)' },
    { value: 'amt', label: 'Transaction Amount' },
  ];

  constructor(private rulesService: RulesService) {}

  ngOnInit() {
    this.rulesService.getRules().subscribe({
      next: (rules) => {
        this.rules = rules;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load rules. Is the fraud engine running?';
        this.loading = false;
      },
    });
  }

  removeRule(index: number) {
    this.rules.splice(index, 1);
  }

  addRule() {
    this.rules.push({
      id: 'rule_' + Date.now(),
      name: 'New Rule',
      description: '',
      feature: 'f_amount_zscore',
      operator: '>',
      threshold: 0,
      penalty: 0.05,
      override: false,
      enabled: true,
    });
  }

  save() {
    this.saving = true;
    this.saved = false;
    this.error = null;

    this.rulesService.updateRules(this.rules).subscribe({
      next: (rules) => {
        this.rules = rules;
        this.saving = false;
        this.saved = true;
        setTimeout(() => (this.saved = false), 3000);
      },
      error: () => {
        this.saving = false;
        this.error = 'Failed to save rules.';
      },
    });
  }
}
