import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface Permission {
  label: string;
  enabled: boolean;
}

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './permissions.component.html',
  styleUrls: []
})
export class PermissionsComponent {
  permissions: Permission[] = [
    { label: 'View Dashboard', enabled: true },
    { label: 'View Transaction Details', enabled: true },
    { label: 'Mark Transaction as Fraud', enabled: false },
    { label: 'Mark Transaction as Legitimate', enabled: false }
  ];

  savePermissions() {
    console.log('Saving permissions:', this.permissions);
    alert('Permissions saved successfully (simulation).');
  }
}

