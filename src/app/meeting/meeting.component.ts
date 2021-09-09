import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseApp } from '@angular/fire';
import { AngularFireDatabase } from '@angular/fire/database';
import { v4 as uuid } from 'uuid';

import { VideoChatManager } from 'lib/simplevideochat';
import { IChatItem } from '../models/chat.model';
import { LocalStorageService } from '../services/local-storage.service';

@Component({
  selector: 'app-meeting',
  templateUrl: './meeting.component.html',
  styleUrls: ['./meeting.component.scss']
})
export class MeetingComponent implements OnInit, OnDestroy {
  public localStream: MediaStream;
  public userStreams: { [k: string]: MediaStream } = {};
  public muted = false;
  public isVideoOff = false;
  public isScreenShare = false;
  public error: string;
  public chat: IChatItem[] = [];
  public sessionId: string;
  public username: string;
  public showChat = false;
  private roomId: string;
  private vc: VideoChatManager;
  private clientWidth: number;

  constructor(
    private activatedRoute: ActivatedRoute,
    private database: AngularFireDatabase,
    private firebaseApp: FirebaseApp,
    private router: Router,
    private localStorageService: LocalStorageService,
  ) {
    this.firebaseApp.database = () => database.database;
  }

  ngOnInit(): void {
    this.getRoomId();
    this.setSessionId();
    this.getUserName();
    this.getClientWidth();
    this.setUpVideoCall();
  }

  private getRoomId(): void {
    this.roomId = this.activatedRoute.snapshot.params.id;
  }

  private setSessionId(): void {
    this.sessionId = uuid();
  }

  private getUserName(): void {
    this.username = this.localStorageService.getName();
  }

  private getClientWidth(): void {
    this.clientWidth = window.innerWidth;
  }

  private async setUpVideoCall(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      this.error = '';
      this.initVideoCall();
    } catch (err) {
      this.errorHandler(err);
      this.localStream = null;
    }
  }

  private initVideoCall(): void {
    this.vc = new VideoChatManager(
      this.sessionId, this.roomId, this.username, this.localStream, this.firebaseApp.database()
    );

    this.vc.onRemoteStreamAdded = (id, remoteStream: MediaStream) => {
      console.log('<----------------- New Remote Stream');
      console.log(`remote stream added ${id}`, remoteStream);
      console.log(`${id} stream tracks`, remoteStream.getTracks());
      console.log('----------------->');
      this.userStreams[id] = remoteStream;
    };

    this.vc.onRemoteStreamRemoved = (id) => {
      delete this.userStreams[id];
    };

    this.vc.onChatUpdate = (chatItem: IChatItem) => {
      this.chat = [...this.chat, chatItem];
    };
  }

  private errorHandler(err): void {
    console.warn(err);
    if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      this.error = 'Required track is missing ';
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      this.error = 'Webcam or mic are already in use';
    } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
      this.error = 'Constraints can not be satisfied by avb. devices';
    } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      this.error = 'Permission denied in browser';
    } else if (err.name === 'TypeError' || err.name === 'TypeError') {
      this.error = 'Empty constraints object';
    } else {
      this.error = 'Something went wrong';
    }
  }

  private replaceVideoTrack(): void {
    try {
      if (this.vc) {
        Object.values(this.vc._calls).forEach((stream, index) => {
          const videoTrack = this.localStream.getVideoTracks()[0];
          // @ts-ignore
          const sender = stream._pc.getSenders().find(s => {
            return s.track.kind === videoTrack.kind;
          });
          sender.replaceTrack(videoTrack);
        });
      } else {
        this.initVideoCall();
      }
    } catch (err) {
      console.error('Error: ' + err);
    }
  }

  public async toggleCapture(): Promise<void>  {
    if (this.isScreenShare) {
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        this.error = '';
        this.replaceVideoTrack();
      } catch (err) {
        this.errorHandler(err);
        this.localStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
      this.isScreenShare = false;
    } else {
      try {
        // @ts-ignore
        this.localStream = await navigator.mediaDevices.getDisplayMedia();
        this.error = '';
        this.replaceVideoTrack();
        this.isScreenShare = true;
      } catch (err) {
        this.errorHandler(err);
      }
    }
  }

  public getVideoStreams(): MediaStream[] {
    return Object.values(this.userStreams);
  }

  public disconnect(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    }
    this.firebaseApp.database().ref(`room/${this.roomId}/${this.sessionId}`).remove();
    this.router.navigate(['connect']);
  }

  public toggleAudio(): void {
    if (this.localStream) {
      this.muted = !this.muted;
      this.localStream.getAudioTracks().forEach((track: MediaStreamTrack) => {
        track.enabled = !track.enabled;
      });
    }
  }

  public toggleVideo(): void {
    if (this.localStream) {
      this.isVideoOff = !this.isVideoOff;
      this.localStream.getVideoTracks().forEach((track: MediaStreamTrack) => {
        track.enabled = !track.enabled;
      });
    }
  }

  public sendMessage(message: string): void {
    this.vc.sendMessage(message, this.sessionId);
  }

  public isMobile(): boolean {
    return this.clientWidth < 1024;
  }

  public openChat(): void {
    this.showChat = true;
  }

  public closeChat(): void {
    this.showChat = false;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
