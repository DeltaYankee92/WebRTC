import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor() { }

  public getName(): string {
    return localStorage.getItem('chatName');
  }

  public saveName(name: string): void {
    localStorage.setItem('chatName', name);
  }

  public getSessionId(): string {
    return localStorage.getItem('sessionId');
  }

  public setSessionId(id: string): void {
    localStorage.setItem('sessionId', id);
  }
}
