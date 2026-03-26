import { ChangeDetectorRef, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LlmService, ChatMessage } from '../../../core/services/llm.service';
import { Transaction } from '../../../core/services/transaction.service';

@Component({
  selector: 'app-fraud-copilot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fraud-copilot.component.html',
})
export class FraudCopilotComponent {
  @Input() transaction: Transaction | null = null;

  isOpen = false;
  userInput = '';
  isLoading = false;
  messages: ChatMessage[] = [];

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;

  constructor(private llmService: LlmService, private cdr: ChangeDetectorRef) {}

  toggle() {
    this.isOpen = !this.isOpen;
  }

  send() {
    const text = this.userInput.trim();
    if (!text || this.isLoading) return;

    this.messages.push({ role: 'user', content: text });
    this.userInput = '';
    this.isLoading = true;
    this.scrollToBottom();

    const assistantMsg: ChatMessage = { role: 'assistant', content: '' };
    this.messages.push(assistantMsg);

    this.llmService.chatStream(this.messages.slice(0, -1), this.transaction).subscribe({
      next: (token) => {
        assistantMsg.content += token;
        this.cdr.detectChanges();
        this.scrollToBottom();
      },
      error: () => {
        assistantMsg.content = assistantMsg.content || 'Sorry, something went wrong. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
        this.scrollToBottom();
      },
      complete: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.scrollToBottom();
      }
    });
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
