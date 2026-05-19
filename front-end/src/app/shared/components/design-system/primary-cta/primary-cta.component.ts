import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-primary-cta',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <a *ngIf="routerLink; else buttonTpl" 
       [routerLink]="routerLink" 
       [class]="'cta-btn cta-btn--' + variant"
       [style.min-height]="customHeight">
      <span class="cta-btn__icon" *ngIf="icon">{{ icon }}</span>
      <span class="cta-btn__label">{{ label }}</span>
    </a>
    <ng-template #buttonTpl>
      <button [class]="'cta-btn cta-btn--' + variant" 
              [style.min-height]="customHeight"
              (click)="clicked.emit($event)">
        <span class="cta-btn__icon" *ngIf="icon">{{ icon }}</span>
        <span class="cta-btn__label">{{ label }}</span>
      </button>
    </ng-template>
  `,
  styleUrls: ['./primary-cta.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrimaryCtaComponent {
  @Input() label: string = '';
  @Input() icon?: string;
  @Input() variant: 'primary' | 'amber' | 'green' | 'duo' | 'white' = 'primary';
  @Input() routerLink?: string | any[];
  @Input() customHeight?: string;
  
  // For buttons without routerLink
  @Input() clicked: any; // EventEmitter if needed
}
