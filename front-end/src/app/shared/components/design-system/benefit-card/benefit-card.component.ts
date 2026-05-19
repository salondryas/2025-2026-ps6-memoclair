import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-benefit-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <a [routerLink]="link" class="card">
      <div class="card__image-wrapper" *ngIf="imageUrl">
        <img [src]="imageUrl" [alt]="title" class="card__image">
      </div>
      <div class="card__content">
        <h2 class="card__title">{{ title }}</h2>
        <p class="card__description">{{ description }}</p>
      </div>
    </a>
  `,
  styleUrls: ['./benefit-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BenefitCardComponent {
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() imageUrl?: string;
  @Input() link: string | any[] = '';
}
