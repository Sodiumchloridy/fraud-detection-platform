import { Component, Input } from '@angular/core';
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
export class MainLayoutComponent {
  @Input() pageTitle: string = 'Dashboard ';
  userName: string;
  isAdmin: boolean;

  constructor(private router: Router, private userService: UserService) {
    this.userName = userService.getCurrentUser()?.username ?? 'User';
    this.isAdmin = userService.isAdmin();
  }

  handleLogout() {
    this.userService.logout();
    this.router.navigate(['/login']);
  }
}
