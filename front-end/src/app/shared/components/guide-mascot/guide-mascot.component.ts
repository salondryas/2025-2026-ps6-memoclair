import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-guide-mascot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './guide-mascot.component.html',
  styleUrls: ['./guide-mascot.component.scss']
})
export class GuideMascotComponent {
  // Le texte que la mascotte va dire (la question)
  @Input() text: string = '';
  // Le chemin vers la nouvelle mascotte
  @Input() mascotImage: string = 'assets/UI/mascotte-famme2.png';
}
