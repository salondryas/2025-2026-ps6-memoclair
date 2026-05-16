import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface SizeOption {
  value: number;
  label: string;
  preview: string;
}

@Component({
  selector: 'app-font-size-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './font-size-slider.html',
  styleUrl: './font-size-slider.scss',
})
export class FontSizeSlider {
  @Input() value: number = 1;
  @Output() valueChange = new EventEmitter<number>();

  readonly options: SizeOption[] = [
    { value: 1,    label: 'Normal',     preview: 'Aa' },
    { value: 1.25, label: 'Grand',      preview: 'Aa' },
    { value: 1.5,  label: 'Très grand', preview: 'Aa' },
  ];

  select(size: number): void {
    this.valueChange.emit(size);
  }
}
