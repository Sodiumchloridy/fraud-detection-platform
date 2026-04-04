import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MainLayoutComponent } from '../../../shared/layouts/main-layout/main-layout.component';
import { UserService } from '../../../core/services';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, RouterLink, MainLayoutComponent, QRCodeComponent],
  templateUrl: './settings.component.html',
  styleUrls: []
})
export class SettingsComponent {
  mfaEnabled: boolean;
  showSetup = false;
  setupSecret = '';
  otpauthUri = '';
  confirmCode = '';
  message = '';
  messageType: 'error' | 'success' = 'error';

  constructor(private userService: UserService) {
    this.mfaEnabled = this.userService.getCurrentUser()?.twoFactorEnabled ?? false;
  }

  startSetup() {
    this.message = '';
    this.userService.setup2fa().subscribe({
      next: (res) => {
        this.setupSecret = res.secret;
        this.otpauthUri = res.otpauthUri;
        this.showSetup = true;
      },
      error: () => this.showMessage('Failed to start 2FA setup', 'error')
    });
  }

  confirmSetup() {
    this.message = '';
    this.userService.confirm2fa(this.confirmCode).subscribe({
      next: () => {
        this.mfaEnabled = true;
        this.showSetup = false;
        this.confirmCode = '';
        this.showMessage('2FA enabled successfully', 'success');
      },
      error: () => this.showMessage('Invalid verification code', 'error')
    });
  }

  disableMfa() {
    this.message = '';
    this.userService.disable2fa().subscribe({
      next: () => {
        this.mfaEnabled = false;
        this.showMessage('2FA disabled', 'success');
      },
      error: () => this.showMessage('Failed to disable 2FA', 'error')
    });
  }

  private showMessage(text: string, type: 'error' | 'success') {
    this.message = text;
    this.messageType = type;
  }
}

