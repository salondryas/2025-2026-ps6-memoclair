import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { MediaItem, MediaKind, MemoryCueType } from '../../../models/media.model';
import { PatientId, PatientSummary } from '../../../models/patient.model';
import { PatientContextService } from '../../../core/services/patient-context.service';
import { MediaLibraryService } from '../services/media-library.service';
import { CaregiverShellComponent } from '../../../shared/components/layout/caregiver-shell/caregiver-shell.component';
import { environment } from '../../../../environments/environment';

const DUO_REQUIRED = 9;

interface MediaFormValue {
  description: string;
  kind: MediaKind;
  cueType: MemoryCueType;
}

@Component({
  selector: 'app-caregiver-media-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CaregiverShellComponent],
  templateUrl: './caregiver-media-page.component.html',
  styleUrls: ['./caregiver-media-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaregiverMediaPageComponent implements OnInit, OnDestroy {
  patients: PatientSummary[] = [];
  selectedPatientId!: PatientId;
  mediaItems: MediaItem[] = [];
  fileInputLabel = 'Aucun fichier choisi';
  saveStatus = '';
  validationMessage = '';
  uploading = false;

  readonly duoRequired = DUO_REQUIRED;

  readonly kindOptions: ReadonlyArray<{ value: MediaKind; label: string }> = [
    { value: 'image', label: 'Photo / image' },
    { value: 'audio', label: 'Audio / musique' },
  ];

  readonly cueOptions: ReadonlyArray<{ value: MemoryCueType; label: string }> = [
    { value: 'location', label: 'Lieu' },
    { value: 'person', label: 'Personne' },
    { value: 'event', label: 'Événement' },
    { value: 'music', label: 'Musique' },
  ];
  private readonly cueLabels: Record<MemoryCueType, string> = {
    location: 'Lieu',
    person: 'Famille',
    event: 'Événement',
    music: 'Musique',
    object: 'Objet',
  };

  form: MediaFormValue = this.createEmptyForm();
  private selectedFile: File | null = null;
  private patientSubscription?: Subscription;

  constructor(
    private readonly patientContextService: PatientContextService,
    private readonly mediaLibraryService: MediaLibraryService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.patients = this.patientContextService.getPatients();
    this.selectedPatientId = this.patientContextService.getActivePatientSnapshot().id;
    this.loadMedia(this.selectedPatientId);

    this.patientSubscription = this.patientContextService.activePatient$.subscribe((patient) => {
      if (patient.id === this.selectedPatientId) return;
      this.selectedPatientId = patient.id;
      this.loadMedia(patient.id);
    });
  }

  onPatientChange(patientId: string): void {
    const typed = patientId as PatientId;
    this.patientContextService.setActivePatient(typed);
    this.selectedPatientId = typed;
    this.loadMedia(typed);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.item(0) ?? null;
    this.selectedFile = file;
    this.fileInputLabel = file?.name ?? 'Aucun fichier choisi';
    this.clearMessages();
  }

  addMediaItem(): void {
    const errors = this.validateForm();
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
        this.form = this.createEmptyForm();
        this.selectedFile = null;
        this.fileInputLabel = 'Aucun fichier choisi';
        this.saveStatus = `Média ajouté pour ${this.currentPatient.firstName}.`;
        this.uploading = false;
        this.loadMedia(this.selectedPatientId);
      },
      error: () => {
        this.validationMessage = 'Erreur lors de l\'upload. Vérifiez que le backend est démarré.';
        this.uploading = false;
        this.cdr.markForCheck();
      },
    });
  }

  deleteMediaItem(itemId: string): void {
    this.mediaLibraryService.deleteMediaItem(this.selectedPatientId, itemId).subscribe({
      next: () => {
        this.saveStatus = 'Média supprimé.';
        this.loadMedia(this.selectedPatientId);
      },
      error: () => {
        this.validationMessage = 'Erreur lors de la suppression.';
        this.cdr.markForCheck();
      },
    });
  }

  trackByMediaId(_: number, item: MediaItem): string {
    return item.id;
  }

  getMediaPreviewUrl(item: MediaItem): string {
    return `${environment.backendUrl}/uploads/${encodeURIComponent(item.fileName)}`;
  }

  getCueLabel(cueType: MemoryCueType): string {
    return this.cueLabels[cueType];
  }

  get currentPatient(): PatientSummary {
    return (
      this.patients.find((p) => p.id === this.selectedPatientId)
      ?? this.patients[0]
      ?? { id: 'marcel', firstName: 'Marcel', displayName: 'Marcel D.', stageLabel: 'Stade avancé' }
    );
  }

  get emptyState(): boolean {
    return this.mediaItems.length === 0;
  }

  get duoProgress(): string {
    const count = this.mediaItems.length;
    if (count >= DUO_REQUIRED) return `✓ ${count} médias — mode duo disponible`;
    return `${count} / ${DUO_REQUIRED} médias — pour pouvoir jouer au jeu B en solo ou en duo`;
  }

  get duoReady(): boolean {
    return this.mediaItems.length >= DUO_REQUIRED;
  }

  ngOnDestroy(): void {
    this.patientSubscription?.unsubscribe();
  }

  private loadMedia(patientId: PatientId): void {
    this.mediaLibraryService.getMediaItems(patientId).subscribe({
      next: (items) => {
        this.mediaItems = items;
        this.form = this.createEmptyForm();
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

  private validateForm(): string[] {
    const errors: string[] = [];
    if (!this.form.description.trim()) errors.push('Ajoutez une description pour ce souvenir.');
    if (!this.selectedFile) errors.push('Choisissez un fichier avant de l\'ajouter.');
    return errors;
  }

  private clearMessages(): void {
    this.validationMessage = '';
    this.saveStatus = '';
  }

  private createEmptyForm(): MediaFormValue {
    return { description: '', kind: 'image', cueType: 'location' };
  }
}
