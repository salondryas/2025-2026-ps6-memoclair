import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  Gamepad2,
  Image as ImageIcon,
  LucideAngularModule,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';

@Component({
  selector: 'app-family-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ Gamepad2, ImageIcon }),
    },
  ],
  templateUrl: './family-dashboard-page.component.html',
  styleUrls: ['./family-dashboard-page.component.scss'],
})
export class FamilyDashboardPageComponent {
  readonly icons = { Gamepad2, ImageIcon };
}
