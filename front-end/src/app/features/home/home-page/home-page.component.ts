import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  HeartHandshake,
  Image as ImageIcon,
  Users,
  Building2,
  BrainCircuit,
  Volume2,
  LUCIDE_ICONS,
  LucideIconProvider,
} from 'lucide-angular';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    RouterModule,
    LucideAngularModule,
  ],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ HeartHandshake, ImageIcon, Users, Building2, BrainCircuit, Volume2 }),
    },
  ],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
})
export class HomePageComponent {}
