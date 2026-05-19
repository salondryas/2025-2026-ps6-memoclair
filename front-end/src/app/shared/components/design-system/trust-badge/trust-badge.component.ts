import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-trust-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="badge" [class.badge--small]="size === 'sm'">
      <span class="badge__icon" *ngIf="icon">{{ icon }}</span>
      <span class="badge__text">{{ text }}</span>
    </div>
  `,
  styleUrls: ['./trust-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrustBadgeComponent {
  @Input() text: string = '';
  @Input() icon: string = '✨';
  @Input() size: 'sm' | 'md' = 'md';
}
