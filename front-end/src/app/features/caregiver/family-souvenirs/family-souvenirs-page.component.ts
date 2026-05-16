import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { MediaItem, MediaKind, MemoryCueType } from '../../../models/media.model';
import { PatientId, PatientSummary } from '../../../models/patient.model';
import { PatientContextService } from '../../../core/services/patient-context.service';
import { MediaLibraryService } from '../services/media-library.service';

const DUO_REQUIRED = 9;

interface SouvenirFormValue {
  description: string;
  kind: MediaKind;
  cueType: MemoryCueType;
}

@Component({
  selector: 'app-family-souvenirs-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './family-souvenirs-page.component.html',
  styleUrls: ['./family-souvenirs-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilySouvenirsPageComponent implements OnInit, OnDestroy {
  patients: PatientSummary[] = [];
  selectedPatientId!: PatientId;
  mediaItems: MediaItem[] = [];
  fileInputLabel = 'Aucun fichier choisi';
  saveStatus = '';
  validationMessage = '';
  uploading = false;

  readonly duoRequired = DUO_REQUIRED;

  readonly kindOptions: ReadonlyArray<{ value: MediaKind; label: string }> = [
    { value: 'image', label: 'Photo ou image' },
    { value: 'audio', label: 'Musique ou audio' },
  ];

  readonly cueOptions: ReadonlyArray<{ value: MemoryCueType; label: string }> = [
    { value: 'person',   label: 'Une personne / un proche' },
    { value: 'location', label: 'Un lieu' },
    { value: 'event',    label: 'Un moment / événement' },
    { value: 'music',    label: 'Une musique / chanson' },
  ];

  form: SouvenirFormValue = this.emptyForm();
  private selectedFile: File | null = null;
  private patientSub?: Subscription;

  constructor(
    private readonly patientContextService: PatientContextService,
    private readonly mediaLibraryService: MediaLibraryService,
    private readonly cdr: ChangeDetectorRef,
    private readonly location: Location,
  ) {}

  ngOnInit(): void {
    this.patients = this.patientContextService.getPatients();
    this.selectedPatientId = this.patientContextService.getActivePatientSnapshot().id;
    this.loadMedia(this.selectedPatientId);

    this.patientSub = this.patientContextService.activePatient$.subscribe((patient) => {
      if (patient.id === this.selectedPatientId) return;
      this.selectedPatientId = patient.id;
      this.loadMedia(patient.id);
    });
  }

  ngOnDestroy(): void {
    this.patientSub?.unsubscribe();
  }

  goBack(): void {
    this.location.back();
  }

  onPatientChange(patientId: string): void {
    const id = patientId as PatientId;
    this.patientContextService.setActivePatient(id);
    this.selectedPatientId = id;
    this.loadMedia(id);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.item(0) ?? null;
    this.selectedFile = file;
    this.fileInputLabel = file?.name ?? 'Aucun fichier choisi';
    this.clearMessages();
  }

  addSouvenir(): void {
    const errors = this.validate();
    if (errors.length > 0) {
      this.validationMessage = errors[0];
      this.saveStatus = '';
      this.cdr.markForCheck();
      return;
    }

    this.uploading = true;
    this.validationMessage = '';
    this.saveStatus = '';
    this.cdr.markForCheck();

    const desc = this.form.description.trim();
    const title = desc.split('\n')[0].slice(0, 80) || desc.slice(0, 80);

    this.mediaLibraryService.uploadMediaItem(this.selectedPatientId, this.selectedFile!, {
      title,
      kind: this.form.kind,
      cueType: this.form.cueType,
      clinicalNote: desc,
    }).subscribe({
      next: () => {
        this.form = this.emptyForm();
        this.selectedFile = null;
        this.fileInputLabel = 'Aucun fichier choisi';
        this.saveStatus = `Souvenir ajouté pour ${this.currentPatient.firstName} !`;
        this.uploading = false;
        this.loadMedia(this.selectedPatientId);
      },
      error: () => {
        this.validationMessage = 'Impossible d\'enregistrer le souvenir. Vérifiez votre connexion.';
        this.uploading = false;
        this.cdr.markForCheck();
      },
    });
  }

  deleteSouvenir(itemId: string): void {
    this.mediaLibraryService.deleteMediaItem(this.selectedPatientId, itemId).subscribe({
      next: () => {
        this.saveStatus = 'Souvenir supprimé.';
        this.loadMedia(this.selectedPatientId);
      },
      error: () => {
        this.validationMessage = 'Erreur lors de la suppression.';
        this.cdr.markForCheck();
      },
    });
  }

  trackById(_: number, item: MediaItem): string {
    return item.id;
  }

  get currentPatient(): PatientSummary {
    return (
      this.patients.find((p) => p.id === this.selectedPatientId) ?? this.patients[0]
    );
  }

  get emptyState(): boolean {
    return this.mediaItems.length === 0;
  }

  get duoProgress(): string {
    const count = this.mediaItems.length;
    if (count >= DUO_REQUIRED) return `✓ ${count} souvenirs — le jeu duo est disponible`;
    return `${count} / ${DUO_REQUIRED} souvenirs pour débloquer le jeu duo`;
  }

  get duoReady(): boolean {
    return this.mediaItems.length >= DUO_REQUIRED;
  }

  private loadMedia(patientId: PatientId): void {
    this.mediaLibraryService.getMediaItems(patientId).subscribe({
      next: (items) => {
        this.mediaItems = items;
        this.form = this.emptyForm();
        this.selectedFile = null;
        this.fileInputLabel = 'Aucun fichier choisi';
        this.clearMessages();
        this.cdr.markForCheck();
      },
      error: () => {
        this.mediaItems = [];
        this.cdr.markForCheck();
      },
    });
  }

  private validate(): string[] {
    const errors: string[] = [];
    if (!this.form.description.trim()) errors.push('Décrivez ce souvenir avant de l\'ajouter.');
    if (!this.selectedFile) errors.push('Choisissez un fichier photo ou audio.');
    return errors;
  }

  private clearMessages(): void {
    this.validationMessage = '';
    this.saveStatus = '';
  }

  private emptyForm(): SouvenirFormValue {
    return { description: '', kind: 'image', cueType: 'person' };
  }
}
