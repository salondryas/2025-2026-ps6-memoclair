import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss',
})
export class ThemeToggle {
  @Input() enabled: boolean = false;
  @Input() label: string = 'Contraste élevé';
  @Input() description: string = 'Renforce les contrastes pour une meilleure lisibilité.';
  @Output() enabledChange = new EventEmitter<boolean>();

  toggle(): void {
    this.enabledChange.emit(!this.enabled);
  }
}
