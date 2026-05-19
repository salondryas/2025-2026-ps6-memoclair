import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-recommended-game-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reco-badge">
      <span class="reco-badge__star">⭐</span>
      <span class="reco-badge__label">{{ label }}</span>
      <span class="reco-badge__title" *ngIf="gameTitle">: {{ gameTitle }}</span>
    </div>
  `,
  styleUrls: ['./recommended-game-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecommendedGameBadgeComponent {
  @Input() label: string = 'Recommandé pour vous';
  @Input() gameTitle?: string;
}
