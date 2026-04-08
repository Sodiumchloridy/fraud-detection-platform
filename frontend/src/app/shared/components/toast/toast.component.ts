import { Component, inject } from '@angular/core';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-center gap-3 min-w-[280px] max-w-sm px-4 py-3 rounded-2xl shadow-lg text-sm font-medium animate-slide-up"
          [class]="toastClass(toast)">
          <!-- Icon -->
          @if (toast.type === 'success') {
            <svg class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
            </svg>
          } @else if (toast.type === 'error') {
            <svg class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" stroke-width="2"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.93 4.93l14.14 14.14"/>
            </svg>
          } @else {
            <svg class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          }
          <span class="flex-1">{{ toast.message }}</span>
          <button (click)="toastService.dismiss(toast.id)" class="opacity-60 hover:opacity-100 transition">
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(12px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0)   scale(1); }
    }
    .animate-slide-up { animation: slide-up 0.2s ease-out; }
  `],
})
export class ToastComponent {
  toastService = inject(ToastService);

  toastClass(toast: Toast): string {
    if (toast.type === 'success') return 'bg-emerald-600 text-white';
    if (toast.type === 'error')   return 'bg-rose-600 text-white';
    return 'bg-slate-800 text-white';
  }
}
