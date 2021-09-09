import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ConnectToRoomComponent } from './connect-to-room/connect-to-room.component';
import { MeetingComponent } from './meeting/meeting.component';

const routes: Routes = [
  {
    path: 'connect',
    component: ConnectToRoomComponent,
  },
  {
    path: 'meeting/:id',
    component: MeetingComponent,
  },
  {
    path: '**',
    redirectTo: 'connect'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
