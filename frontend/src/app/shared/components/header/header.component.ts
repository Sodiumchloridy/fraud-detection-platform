import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * Feature 4: Child component in component hierarchy (root -> layout -> header)
 * Feature 5: Uses @Input to receive data from parent layout component
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: []
})
export class HeaderComponent {
  // Feature 5: @Input decorator to receive page title from parent component
  @Input() pageTitle: string = 'Fraud Detection Dashboard';
  
  // Feature 5: @Input decorator to receive user name from parent
  @Input() userName: string = 'Admin';
  
  // Feature 5: @Output decorator to emit logout event to parent component
  @Output() logout = new EventEmitter<void>();
  
  // Track dropdown menu visibility
  isDropdownOpen = false;
  
  // Feature 3: Event binding - Toggle dropdown menu
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
  
  // Feature 3: Event binding - Handle logout click
  onLogout() {
    this.logout.emit();
  }
}
