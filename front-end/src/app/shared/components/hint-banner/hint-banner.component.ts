import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-hint-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hint-banner.component.html',
  styleUrl: './hint-banner.component.scss',
})
export class HintBannerComponent {
  @Input() hint: string | null = null;

  @Output() hintRequested = new EventEmitter<void>();
}
