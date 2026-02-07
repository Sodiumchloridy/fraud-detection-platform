import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: []
})
export class HeaderComponent {
  @Input() pageTitle: string = 'Fraud Detection Dashboard';
  @Input() userName: string = 'Admin';
  @Output() logout = new EventEmitter<void>();
  
  // Track dropdown menu visibility
  isDropdownOpen = false;
  
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
  
  onLogout() {
    this.logout.emit();
  }
}
