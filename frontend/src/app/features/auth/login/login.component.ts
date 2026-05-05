import { Component, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: []
})
export class LoginComponent {
  username = '';
  password = '';
  digits = ['', '', '', '', '', ''];
  errorMessage = '';
  preAuthToken = '';
  showTwoFactor = false;

  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

  get code(): string {
    return this.digits.join('');
  }

  constructor(
    private router: Router,
    private userService: UserService
  ) { }

  login() {
    this.errorMessage = '';
    this.userService.login({ username: this.username, password: this.password }).subscribe({
      next: (res) => {
        if (res.twoFactorRequired) {
          this.preAuthToken = res.preAuthToken!;
          this.showTwoFactor = true;
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: () => this.errorMessage = 'Invalid username or password'
    });
  }

  onDigitInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const numeric = input.value.replace(/\D/g, '');
    const digit = numeric.slice(-1);
    this.digits[index] = digit;
    input.value = digit;
    if (digit && index < 5) {
      this.digitInputs.toArray()[index + 1].nativeElement.focus();
    }
  }

  onDigitKeyDown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace') {
      if (this.digits[index]) {
        this.digits[index] = '';
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
    nums.split('').forEach((d, i) => this.digits[i] = d);
    for (let i = nums.length; i < 6; i++) this.digits[i] = '';
    const inputs = this.digitInputs.toArray();
    inputs.forEach((el, i) => el.nativeElement.value = this.digits[i]);
    inputs[Math.min(nums.length, 5)].nativeElement.focus();
  }

  verify() {
    this.errorMessage = '';
    this.userService.verify2fa(this.preAuthToken, this.code).subscribe({
      next: (res) => this.router.navigate(['/dashboard']),
      error: () => this.errorMessage = 'Invalid verification code'
    });
  }

  backToLogin() {
    this.showTwoFactor = false;
    this.digits = ['', '', '', '', '', ''];
    this.errorMessage = '';
  }
}

