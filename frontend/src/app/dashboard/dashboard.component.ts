import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  time: string;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  transactionsToday = 5;
  fraudAlerts = 2;
  transactions: Transaction[] = [
    { id: 'TXN-2024-001', amount: 4567.89, type: 'Online Purchase', time: '14:32', risk: 'HIGH' },
    { id: 'TXN-2024-002', amount: 120.00, type: 'Card Present', time: '14:30', risk: 'LOW' },
    { id: 'TXN-2024-003', amount: 890.50, type: 'CNP Transaction', time: '14:25', risk: 'MEDIUM' },
    { id: 'TXN-2024-004', amount: 300.00, type: 'ATM Withdrawal', time: '14:22', risk: 'LOW' },
    { id: 'TXN-2024-005', amount: 1899.00, type: 'Online Purchase', time: '14:19', risk: 'HIGH' },
  ];
  private intervalId: any;
  private txnCounter = 6;
  isAdmin = true;

  ngOnInit() {
    this.intervalId = setInterval(() => this.createDummyTransaction(), 4000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  createDummyTransaction() {
    const transactionTypes = ['Online Purchase', 'Card Present', 'CNP Transaction', 'Mobile Payment', 'ATM Withdrawal'];
    const riskLevels: ('HIGH' | 'MEDIUM' | 'LOW')[] = ['HIGH', 'MEDIUM', 'LOW'];

    const amount = parseFloat((Math.random() * 5000).toFixed(2));
    const risk = riskLevels[Math.floor(Math.random() * riskLevels.length)];
    const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newTxn: Transaction = {
      id: `TXN-2024-${this.txnCounter.toString().padStart(3, '0')}`,
      amount,
      type,
      time,
      risk
    };

    this.transactions.unshift(newTxn);
    if (this.transactions.length > 10) {
      this.transactions.pop();
    }

    this.transactionsToday++;
    if (risk === 'HIGH') {
      this.fraudAlerts++;
    }
    this.txnCounter++;
  }
}

