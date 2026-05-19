import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-product-hero',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hero">
      <div class="hero__logo-container" *ngIf="logoUrl">
        <img [src]="logoUrl" alt="Brand Logo" class="hero__logo">
      </div>
      <h1 class="hero__title" *ngIf="title">{{ title }}</h1>
      <p class="hero__tagline" *ngIf="tagline">{{ tagline }}</p>
      <ng-content></ng-content>
    </div>
  `,
  styleUrls: ['./product-hero.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductHeroComponent {
  @Input() title: string = '';
  @Input() tagline: string = '';
  @Input() logoUrl?: string;
}
