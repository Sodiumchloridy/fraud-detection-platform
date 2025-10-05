import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MainLayoutComponent } from '../../../shared/layouts/main-layout/main-layout.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MainLayoutComponent],
  templateUrl: './settings.component.html',
  styleUrls: []
})
export class SettingsComponent {
  mfaEnabled = true;
}

