import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MainLayoutComponent } from '../../../shared/layouts/main-layout/main-layout.component';
import { ThresholdSettingsComponent } from '../threshold-settings/threshold-settings.component';
import { RulesSettingsComponent } from '../rules-settings/rules-settings.component';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [RouterLink, MainLayoutComponent, ThresholdSettingsComponent, RulesSettingsComponent],
  templateUrl: './system-settings.component.html',
})
export class SystemSettingsComponent {
  activeTab: 'thresholds' | 'rules' = 'thresholds';
}
