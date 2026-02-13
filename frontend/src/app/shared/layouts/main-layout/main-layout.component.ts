import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: []
})
export class MainLayoutComponent implements OnInit {
  @Input() pageTitle: string = 'Fraud Detection Dashboard';
  userName: string = '';

  constructor(private router: Router, private userService: UserService) {}

  ngOnInit() {
    const user = this.userService.getCurrentUser();
    this.userName = user ? user.username : 'User';
  }

  handleLogout() {
    this.userService.logout();
    this.router.navigate(['/login']);
  }
}
