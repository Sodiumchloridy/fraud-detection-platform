import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrls: []
})
export class HeaderComponent {
  @Input() pageTitle = 'Dashboard';
  @Input() userName = 'Admin';
  @Input() showAdminOptions = false;
  @Output() logout = new EventEmitter<void>();
  isDropdownOpen = false;
  toggleDropdown() { this.isDropdownOpen = !this.isDropdownOpen; }
}
