import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { PatientContextService } from '../../../core/services/patient-context.service';
import { MediaLibraryService } from '../services/media-library.service';
import { MediaItem } from '../../../models/media.model';
import { DuoRoundDto } from '../../../models/session.model';
import { CaregiverShellComponent } from '../../../shared/components/layout/caregiver-shell/caregiver-shell.component';

interface MediaCard {
  media: MediaItem;
  previewUrl: string;
  roundIndex: number | null;
  round: DuoRoundDto | null;
  editing: boolean;
  editText: string;
  saving: boolean;
}

@Component({
  selector: 'app-questions-review-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CaregiverShellComponent],
  templateUrl: './questions-review-page.component.html',
  styleUrls: ['./questions-review-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionsReviewPageComponent implements OnInit {
  cards: MediaCard[] = [];
  loading = true;
  acceptingAll = false;
  error = '';
  patientId = '';

  get unacceptedCount(): number {
    return this.cards.filter((c) => c.round && !c.round.accepted).length;
  }

  constructor(
    private readonly http: HttpClient,
    private readonly mediaService: MediaLibraryService,
    private readonly patientContext: PatientContextService,
    private readonly location: Location,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const patient = this.patientContext.getActivePatientSnapshot();
    this.patientId = patient.id;
    this.loadAll();
  }

  goBack(): void {
    this.location.back();
  }

  private loadAll(): void {
    this.loading = true;
    this.error = '';

    forkJoin({
      mediaItems: this.mediaService.getMediaItems(this.patientId).pipe(catchError(() => of([]))),
      cache: this.http
        .get<{ rounds: DuoRoundDto[] }>(
          `${environment.backendUrl}/api/duo/cache/${this.patientId}`
        )
        .pipe(catchError(() => of({ rounds: [] }))),
    }).subscribe(({ mediaItems, cache }) => {
      const rounds = cache.rounds ?? [];
      this.cards = mediaItems.map((media) => {
        const idx = this.findRoundIndex(media, rounds);
        const round = idx !== null ? rounds[idx] : null;
        return {
          media,
          previewUrl: `${environment.backendUrl}/uploads/${media.patientId}/${media.fileName}`,
          roundIndex: idx,
          round,
          editing: false,
          editText: round?.question ?? '',
          saving: false,
        };
      });
      this.loading = false;
      this.cdr.markForCheck();
    });
  }

  private findRoundIndex(media: MediaItem, rounds: DuoRoundDto[]): number | null {
    const idx = rounds.findIndex((r) => {
      const src = r.mediaSrc ?? '';
      return src.endsWith(`/${media.fileName}`);
    });
    return idx >= 0 ? idx : null;
  }

  startEdit(card: MediaCard): void {
    card.editing = true;
    card.editText = card.round?.question ?? '';
    this.cdr.markForCheck();
  }

  cancelEdit(card: MediaCard): void {
    card.editing = false;
    this.cdr.markForCheck();
  }

  saveEdit(card: MediaCard): void {
    if (!card.round || card.roundIndex === null || !card.editText.trim()) {
      card.editing = false;
      this.cdr.markForCheck();
      return;
    }
    card.saving = true;
    this.http
      .patch(
        `${environment.backendUrl}/api/duo/round/${this.patientId}/${card.roundIndex}`,
        { question: card.editText.trim() }
      )
      .subscribe({
        next: () => {
          card.round!.question = card.editText.trim();
          card.editing = false;
          card.saving = false;
          this.cdr.markForCheck();
        },
        error: () => {
          card.saving = false;
          this.cdr.markForCheck();
        },
      });
  }

  accept(card: MediaCard): void {
    if (!card.round || card.roundIndex === null) return;
    card.saving = true;
    this.http
      .patch(
        `${environment.backendUrl}/api/duo/round/${this.patientId}/${card.roundIndex}`,
        { accepted: true }
      )
      .subscribe({
        next: () => {
          card.round!.accepted = true;
          card.saving = false;
          this.cdr.markForCheck();
        },
        error: () => {
          card.saving = false;
          this.cdr.markForCheck();
        },
      });
  }

  deleteRound(card: MediaCard): void {
    if (!card.round || card.roundIndex === null) return;
    card.saving = true;
    this.http
      .delete(
        `${environment.backendUrl}/api/duo/round/${this.patientId}/${card.roundIndex}`
      )
      .subscribe({
        next: () => {
          card.round = null;
          card.roundIndex = null;
          card.editing = false;
          card.saving = false;
          this.cdr.markForCheck();
        },
        error: () => {
          card.saving = false;
          this.cdr.markForCheck();
        },
      });
  }

  acceptAll(): void {
    const pending = this.cards.filter((c) => c.round && c.roundIndex !== null && !c.round.accepted);
    if (pending.length === 0) return;
    this.acceptingAll = true;
    const requests = pending.map((card) =>
      this.http
        .patch(`${environment.backendUrl}/api/duo/round/${this.patientId}/${card.roundIndex}`, { accepted: true })
        .pipe(catchError(() => of(null)))
    );
    forkJoin(requests).subscribe({
      next: () => {
        pending.forEach((card) => { if (card.round) card.round.accepted = true; });
        this.acceptingAll = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.acceptingAll = false;
        this.cdr.markForCheck();
      },
    });
  }

  trackById(_: number, card: MediaCard): string {
    return card.media.id;
  }
}
