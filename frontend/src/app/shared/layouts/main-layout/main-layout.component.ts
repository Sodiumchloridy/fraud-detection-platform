import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: []
})
export class MainLayoutComponent {
  @Input() pageTitle: string = 'Fraud Detection Dashboard';
  userName: string = 'Admin';
  constructor(private router: Router) {}
  
  handleLogout() {
    console.log('User logged out');
    // Clear any stored auth tokens here
    this.router.navigate(['/login']);
  }
}
