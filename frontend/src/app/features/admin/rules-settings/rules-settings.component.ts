import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { RulesService, FraudRule } from '../../../core/services';
import { ToastService } from '../../../shared/services/toast.service';

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
  loadError: string | null = null;

  activeTab: 'rules' | 'card-overrides' = 'rules';

  // Card lists
  blocklist: string[] = [];
  allowlist: string[] = [];
  newBlocklistCard = '';
  newAllowlistCard = '';
  blocklistError: string | null = null;
  allowlistError: string | null = null;
  savingLists = false;

  readonly operators = ['>', '>=', '<', '<=', '=='];

  readonly featureOptions = [
    { value: 'travel_velocity_kmh', label: 'Travel Velocity (km/h)' },
    { value: 'travel_distance_km', label: 'Travel Distance (km)' },
    { value: 'amount_zscore', label: 'Amount Z-Score' },
    { value: 'amount_to_avg_ratio', label: 'Amount / Average Ratio' },
    { value: 'txn_count_1h', label: 'Transactions in 1 Hour' },
    { value: 'txn_count_24h', label: 'Transactions in 24 Hours' },
    { value: 'txn_count_7d', label: 'Transactions in 7 Days' },
    { value: 'amt_cents', label: 'Amount Cents' },
    { value: 'day_of_week', label: 'Day of Week' },
    { value: 'amt_sum_1h', label: 'Amount Sum in 1 Hour' },
    { value: 'amt_sum_24h', label: 'Amount Sum in 24 Hours' },
    { value: 'amt_sum_7d', label: 'Amount Sum in 7 Days' },
    { value: 'seconds_since_last_txn', label: 'Seconds Since Last Txn' },
    { value: 'hour_of_day', label: 'Hour of Day' },
    { value: 'billing_country_mismatch', label: 'Billing Country Mismatch (0/1)' },
    { value: 'is_risky_email', label: 'Risky Email Domain (0/1)' },
    { value: 'email_domain_mismatch', label: 'Email Domain Mismatch (0/1)' },
    { value: 'is_new_email', label: 'Is New Email (0/1)' },
    { value: 'is_new_device', label: 'Is New Device (0/1)' },
    { value: 'is_new_merchant', label: 'Is New Merchant (0/1)' },
    { value: 'amt', label: 'Transaction Amount' },
  ];

  constructor(private rulesService: RulesService, private toast: ToastService) {}

  ngOnInit() {
    forkJoin({
      rules: this.rulesService.getRules(),
      blocklist: this.rulesService.getBlocklist(),
      allowlist: this.rulesService.getAllowlist(),
    }).subscribe({
      next: ({ rules, blocklist, allowlist }) => {
        this.rules = rules;
        this.blocklist = blocklist;
        this.allowlist = allowlist;
        this.loading = false;
      },
      error: () => {
        this.loadError = 'Failed to load rules. Is the fraud service running?';
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
      feature: 'amount_zscore',
      operator: '>',
      threshold: 0,
      penalty: 0.05,
      override: false,
      enabled: true,
    });
  }

  save() {
    this.saving = true;

    this.rulesService.updateRules(this.rules).subscribe({
      next: (rules) => {
        this.rules = rules;
        this.saving = false;
        this.toast.show('Rules saved successfully');
      },
      error: () => {
        this.saving = false;
        this.toast.show('Failed to save rules.', 'error');
      },
    });
  }

  addToBlocklist() {
    const card = this.newBlocklistCard.trim();
    if (!card) return;
    if (this.blocklist.includes(card)) {
      this.blocklistError = 'Card is already in the blocklist.';
      return;
    }
    if (this.allowlist.includes(card)) {
      this.blocklistError = `"${card}" is already in the allowlist. Remove it first.`;
      return;
    }
    this.blocklist = [...this.blocklist, card];
    this.newBlocklistCard = '';
    this.blocklistError = null;
  }

  removeFromBlocklist(card: string) {
    this.blocklist = this.blocklist.filter(c => c !== card);
  }

  addToAllowlist() {
    const card = this.newAllowlistCard.trim();
    if (!card) return;
    if (this.allowlist.includes(card)) {
      this.allowlistError = 'Card is already in the allowlist.';
      return;
    }
    if (this.blocklist.includes(card)) {
      this.allowlistError = `"${card}" is already in the blocklist. Remove it first.`;
      return;
    }
    this.allowlist = [...this.allowlist, card];
    this.newAllowlistCard = '';
    this.allowlistError = null;
  }

  removeFromAllowlist(card: string) {
    this.allowlist = this.allowlist.filter(c => c !== card);
  }

  saveLists() {
    this.savingLists = true;

    forkJoin({
      blocklist: this.rulesService.updateBlocklist(this.blocklist),
      allowlist: this.rulesService.updateAllowlist(this.allowlist),
    }).subscribe({
      next: ({ blocklist, allowlist }) => {
        this.blocklist = blocklist;
        this.allowlist = allowlist;
        this.savingLists = false;
        this.toast.show('Card overrides saved successfully');
      },
      error: () => {
        this.savingLists = false;
        this.toast.show('Failed to save card lists.', 'error');
      },
    });
  }
}
