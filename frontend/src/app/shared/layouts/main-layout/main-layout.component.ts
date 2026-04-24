import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { timer } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { HeaderComponent } from '../../components/header/header.component';
import { FraudCopilotComponent } from '../../components/fraud-copilot/fraud-copilot.component';
import { UserService } from '../../../core/services/user.service';
import { TransactionService } from '../../../core/services';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FraudCopilotComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: []
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  @Input() pageTitle: string = 'Dashboard ';
  @Input() copilotTransaction: any = null;
  @Input() copilotDashboardContext: any = null;
  userName: string;
  isAdmin: boolean;
  pendingReview = 0;
  private statsSub?: Subscription;

  constructor(
    private router: Router,
    private userService: UserService,
    private transactionService: TransactionService
  ) {
    this.userName = userService.getCurrentUser()?.username ?? 'User';
    this.isAdmin = userService.isAdmin();
  }

  ngOnInit(): void {
    this.statsSub = combineLatest([
      timer(0, 30_000).pipe(
        switchMap(() => this.transactionService.getTransactionStats())
      ),
      this.transactionService.readIds$
    ]).pipe(
      map(([stats, readIds]) => Math.max(0, stats.pendingReview - readIds.size))
    ).subscribe(count => { this.pendingReview = count; });
  }

  ngOnDestroy(): void {
    this.statsSub?.unsubscribe();
  }

  handleLogout() {
    this.userService.logout();
    this.router.navigate(['/login']);
  }
}
