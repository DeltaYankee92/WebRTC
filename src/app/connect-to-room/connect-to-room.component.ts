import { Component, HostListener, OnInit } from '@angular/core';
import { FirebaseApp } from '@angular/fire';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFirestore } from '@angular/fire/firestore';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LocalStorageService } from '../services/local-storage.service';

@Component({
  selector: 'app-connect-to-room',
  templateUrl: './connect-to-room.component.html',
  styleUrls: ['./connect-to-room.component.scss']
})
export class ConnectToRoomComponent implements OnInit {
  public form: FormGroup;
  public roomIds: string[] = [];
  public showActiveRooms = false;
  private clientWidth: number;

  constructor(
    private router: Router,
    private database: AngularFireDatabase,
    private firebaseApp: FirebaseApp,
    private localStorageService: LocalStorageService,
  ) {
    this.firebaseApp.database = () => database.database;
  }

  ngOnInit(): void {
    this.initForm();
    this.getSavedName();
    this.getClientWidth();
    this.getActiveRooms();
  }

  private initForm(): void {
    this.form = new FormGroup({
      name: new FormControl('', [Validators.required]),
      roomId: new FormControl('', [Validators.required]),
    });
  }

  private getSavedName(): void {
    const name = this.localStorageService.getName();

    if (name) {
      this.form.patchValue({ name });
    }
  }

  private getClientWidth(): void {
    this.clientWidth = window.innerWidth;
  }


  private getActiveRooms(): any {
    this.firebaseApp.database().ref('room').on('value', (data) => {
      const rooms = data.toJSON();
      if (rooms) {
        this.roomIds = Object.keys(data.toJSON());
      }
    });
  }


  public goToMeeting(id?: string): void {
    if (id) {
      this.form.patchValue({ roomId: id });
    }

    if (this.form.valid) {
      const { roomId } = this.form.value;
      this.saveName();
      this.router.navigate([`meeting/${roomId}`]);
    }
  }

  private saveName(): void {
    const { name } = this.form.value;
    this.localStorageService.saveName(name);
  }

  public isFormControlValid(controlName: string): boolean {
    return this.form.get(controlName).valid;
  }

  public isMobile(): boolean {
    return this.clientWidth < 1024;
  }

  public openActiveRooms(): void {
    this.showActiveRooms = true;
  }

  public closeActiveRooms(): void {
    this.showActiveRooms = false;
  }
}
