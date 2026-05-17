import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GameAChoice } from '../../../features/games/services/game-a-session.service';

@Component({
  selector: 'app-choice-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './choice-card.component.html',
  styleUrl: './choice-card.component.scss',
})
export class ChoiceCardComponent {
  @Input() choice: GameAChoice = { id: 'a', label: '', image: '' };
  @Input() isCorrect = false;
  @Input() isWrong = false;
  @Input() isAutoHighlighted = false;
  @Input() isDisabled = false;
  @Input() isReading = false;

  @Output() cardClicked = new EventEmitter<void>();

  onCardClick(): void {
    this.cardClicked.emit();
  }
}
