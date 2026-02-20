import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MainLayoutComponent } from '../../../shared/layouts/main-layout/main-layout.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, RouterLink, MainLayoutComponent],
  templateUrl: './settings.component.html',
  styleUrls: []
})
export class SettingsComponent {
  mfaEnabled = true;
}

