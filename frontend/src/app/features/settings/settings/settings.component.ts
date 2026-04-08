import { Component, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MainLayoutComponent } from '../../../shared/layouts/main-layout/main-layout.component';
import { UserService } from '../../../core/services';
import { QRCodeComponent } from 'angularx-qrcode';
import { ToastService } from '../../../shared/services/toast.service';

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

  // Change Password
  useOtpForPassword = false;
  pwCredential = '';
  pwNew = '';
  pwConfirm = '';

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

  constructor(private userService: UserService, private router: Router, private toast: ToastService) {
    this.mfaEnabled = this.userService.getCurrentUser()?.twoFactorEnabled ?? false;
    this.promptChangePassword = this.userService.getCurrentUser()?.promptChangePassword ?? false;
  }

  goBack() { this.router.navigate(['/dashboard']); }

  startSetup() {
    this.userService.setup2fa().subscribe({
      next: (res) => {
        this.setupSecret = res.secret;
        this.otpauthUri = res.otpauthUri;
        this.showSetup = true;
      },
      error: () => this.toast.show('Failed to start 2FA setup', 'error')
    });
  }

  confirmSetup() {
    this.userService.confirm2fa(this.confirmCode).subscribe({
      next: () => {
        this.mfaEnabled = true;
        this.showSetup = false;
        this.confirmDigits = ['', '', '', '', '', ''];
        this.toast.show('2FA enabled successfully');
      },
      error: () => this.toast.show('Invalid verification code', 'error')
    });
  }

  disableMfa() {
    this.userService.disable2fa().subscribe({
      next: () => {
        this.mfaEnabled = false;
        this.toast.show('2FA disabled');
      },
      error: () => this.toast.show('Failed to disable 2FA', 'error')
    });
  }

  submitPasswordChange(): void {
    const credential = this.useOtpForPassword
      ? this.pwCredential.replace(/\D/g, '')
      : this.pwCredential;

    if (!credential || (this.useOtpForPassword && credential.length < 6)) {
      this.toast.show(this.useOtpForPassword ? 'Please enter your 6-digit OTP code' : 'Current password is required', 'error');
      return;
    }
    if (!this.pwNew || this.pwNew.length < 8) {
      this.toast.show('New password must be at least 8 characters', 'error');
      return;
    }
    if (this.pwNew !== this.pwConfirm) {
      this.toast.show('Passwords do not match', 'error');
      return;
    }

    this.userService.changePassword(credential, this.pwNew, this.useOtpForPassword).subscribe({
      next: () => {
        this.toast.show('Password changed successfully');
        this.pwCredential = '';
        this.pwNew = '';
        this.pwConfirm = '';
        this.promptChangePassword = false;
      },
      error: (err) => this.toast.show(err?.error?.message || 'Failed to change password', 'error')
    });
  }
}

