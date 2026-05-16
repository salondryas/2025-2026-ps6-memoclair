import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-mascot-decorator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mascot-decorator.component.html',
  styleUrl: './mascot-decorator.component.scss',
})
export class MascotDecoratorComponent {
  @Input({ required: true }) mascotUrl!: string;
  @Input() positionClass: string = '';
}
