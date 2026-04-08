import { Component, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { MainLayoutComponent } from '../../../shared/layouts/main-layout/main-layout.component';
import { UserService } from '../../../core/services';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, MainLayoutComponent, QRCodeComponent],
  templateUrl: './settings.component.html',
  styleUrls: []
})
export class SettingsComponent {
  mfaEnabled: boolean;
  promptChangePassword: boolean;
  showSetup = false;
  setupSecret = '';
  otpauthUri = '';
  confirmDigits = ['', '', '', '', '', ''];
  message = '';
  messageType: 'error' | 'success' = 'error';

  // Change Password
  useOtpForPassword = false;
  pwCredential = '';
  pwNew = '';
  pwConfirm = '';
  pwMessage = '';
  pwMessageType: 'success' | 'error' = 'error';

  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

  get confirmCode(): string {
    return this.confirmDigits.join('');
  }

  onDigitInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const numeric = input.value.replace(/\D/g, '');
    const digit = numeric.slice(-1);
    this.confirmDigits[index] = digit;
    input.value = digit;
    if (digit && index < 5) {
      this.digitInputs.toArray()[index + 1].nativeElement.focus();
    }
  }

  onDigitKeyDown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace') {
      if (this.confirmDigits[index]) {
        this.confirmDigits[index] = '';
        (event.target as HTMLInputElement).value = '';
      } else if (index > 0) {
        this.digitInputs.toArray()[index - 1].nativeElement.focus();
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      this.digitInputs.toArray()[index - 1].nativeElement.focus();
    } else if (event.key === 'ArrowRight' && index < 5) {
      this.digitInputs.toArray()[index + 1].nativeElement.focus();
    }
  }

  onDigitPaste(event: ClipboardEvent) {
    const pasted = event.clipboardData?.getData('text') ?? '';
    const nums = pasted.replace(/\D/g, '').slice(0, 6);
    if (!nums) return;
    event.preventDefault();
    nums.split('').forEach((d, i) => this.confirmDigits[i] = d);
    for (let i = nums.length; i < 6; i++) this.confirmDigits[i] = '';
    const inputs = this.digitInputs.toArray();
    inputs.forEach((el, i) => el.nativeElement.value = this.confirmDigits[i]);
    inputs[Math.min(nums.length, 5)].nativeElement.focus();
  }

  constructor(private userService: UserService, private location: Location) {
    this.mfaEnabled = this.userService.getCurrentUser()?.twoFactorEnabled ?? false;
    this.promptChangePassword = this.userService.getCurrentUser()?.promptChangePassword ?? false;
  }

  goBack() { this.location.back(); }

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
        this.confirmDigits = ['', '', '', '', '', ''];
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

  submitPasswordChange(): void {
    this.pwMessage = '';
    const credential = this.useOtpForPassword
      ? this.pwCredential.replace(/\D/g, '')
      : this.pwCredential;

    if (!credential || (this.useOtpForPassword && credential.length < 6)) {
      this.showPwMessage(this.useOtpForPassword ? 'Please enter your 6-digit OTP code' : 'Current password is required', 'error');
      return;
    }
    if (!this.pwNew || this.pwNew.length < 8) {
      this.showPwMessage('New password must be at least 8 characters', 'error');
      return;
    }
    if (this.pwNew !== this.pwConfirm) {
      this.showPwMessage('Passwords do not match', 'error');
      return;
    }

    this.userService.changePassword(credential, this.pwNew, this.useOtpForPassword).subscribe({
      next: () => {
        this.showPwMessage('Password changed successfully', 'success');
        this.pwCredential = '';
        this.pwNew = '';
        this.pwConfirm = '';
        this.promptChangePassword = false;
      },
      error: (err) => this.showPwMessage(err?.error?.message || 'Failed to change password', 'error')
    });
  }

  private showPwMessage(text: string, type: 'success' | 'error') {
    this.pwMessage = text;
    this.pwMessageType = type;
  }
}

