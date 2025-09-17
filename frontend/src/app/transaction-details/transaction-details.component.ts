import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

interface RiskFactor {
  description: string;
  type: 'danger' | 'success';
}

interface Transaction {
  id: string;
  amount: number;
  timestamp: string;
  status: string;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  fraudScore: number;
  riskFactors: RiskFactor[];
}

@Component({
  selector: 'app-transaction-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './transaction-details.component.html',
  styleUrls: []
})
export class TransactionDetailsComponent implements OnInit {
  transaction!: Transaction;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    const txnId = this.route.snapshot.paramMap.get('id');
    // In a real app, you would fetch this data from a service based on the txnId
    this.transaction = {
      id: txnId || 'TXN-2024-001',
      amount: 4567.89,
      timestamp: '2024-07-29 14:32:15',
      status: 'Under Review',
      risk: 'HIGH',
      fraudScore: 95,
      riskFactors: [
        { description: 'Transaction amount is significantly higher than user\'s average.', type: 'danger' },
        { description: 'Transaction initiated from a new device.', type: 'danger' },
        { description: 'IP address location does not match billing address country.', type: 'danger' },
        { description: 'Account has a good history of legitimate transactions.', type: 'success' }
      ]
    };
  }

  markAs(status: string) {
    alert(`Transaction marked as: ${status}. Thank you for your feedback.`);
    // In a real application, you would send this feedback to the server.
  }
}

