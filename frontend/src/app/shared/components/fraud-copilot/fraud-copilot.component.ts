import { Component, ElementRef, Input, ViewChild } from '@angular/core';
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

  constructor(private llmService: LlmService) {}

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

    this.llmService.chat(this.messages, this.transaction).subscribe({
      next: (res) => {
        this.messages.push({ role: 'assistant', content: res.reply });
        this.isLoading = false;
        this.scrollToBottom();
      },
      error: () => {
        this.messages.push({ role: 'assistant', content: 'Sorry, something went wrong. Please try again.' });
        this.isLoading = false;
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
