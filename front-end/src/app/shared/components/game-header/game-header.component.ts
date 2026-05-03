import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BrandLogoComponent } from '../brand-logo/brand-logo.component';

@Component({
  selector: 'app-game-header',
  standalone: true,
  imports: [CommonModule, BrandLogoComponent],
  templateUrl: './game-header.component.html',
  styleUrl: './game-header.component.scss',
})
export class GameHeaderComponent {
  @Input() patientName = '';
  @Input() title = '';
  @Input() canGoNext = false;

  @Output() nextClicked = new EventEmitter<void>();

  onNext(): void {
    this.nextClicked.emit();
  }
}
