import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { IChatItem } from '../models/chat.model';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, OnChanges {
  @Input() chatItems: IChatItem[];
  @Input() sessionId: string;
  @Input() username: string;
  @Output() sendMessage: EventEmitter<string> = new EventEmitter<string>();
  @Output() closeChat: EventEmitter<void> = new EventEmitter<void>();
  @ViewChild('scrollContainer') scrollContainer: ElementRef;
  public message: string;

  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges(): void {
    this.scrollToBottom();
  }

  public scrollToBottom(): void {
    setTimeout(() => {
      this.scrollContainer.nativeElement.scrollTop =  this.scrollContainer.nativeElement.scrollHeight;
    }, 0);
  }

  public onSendMessage(): void {
    if (this.message) {
      this.sendMessage.emit(this.message);
      this.message = null;
    }
  }

  public isMyMessage(message: IChatItem): boolean {
    return message.sessionId === this.sessionId && message.sender === this.username;
  }

  public onCloseChat(): void {
    this.closeChat.emit();
  }

}
