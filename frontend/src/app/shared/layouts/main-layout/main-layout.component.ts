import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';

/**
 * Feature 4: Layout component in component hierarchy (root -> layout -> header/content)
 * Feature 5: Passes data to child components via @Input
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: []
})
export class MainLayoutComponent {
  // Feature 5: @Input decorator to receive page title from parent page component
  @Input() pageTitle: string = 'Fraud Detection Dashboard';
  
  userName: string = 'Admin';
  
  constructor(private router: Router) {}
  
  // Feature 3: Event handler for logout event from header component
  // Feature 14: Programmatic navigation after logout
  handleLogout() {
    console.log('User logged out');
    // Clear any stored auth tokens here
    this.router.navigate(['/login']);
  }
}
