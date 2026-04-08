import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MainLayoutComponent } from '../../../shared/layouts/main-layout/main-layout.component';
import { ThresholdSettingsComponent } from '../threshold-settings/threshold-settings.component';
import { RulesSettingsComponent } from '../rules-settings/rules-settings.component';

@Component({
  selector: 'app-platform-configuration',
  standalone: true,
  imports: [MainLayoutComponent, ThresholdSettingsComponent, RulesSettingsComponent],
  templateUrl: './platform-configuration.component.html',
})
export class PlatformConfigurationComponent {
  activeTab: 'thresholds' | 'rules' = 'thresholds';

  constructor(private router: Router) {}

  goBack() { this.router.navigate(['/dashboard']); }
}
