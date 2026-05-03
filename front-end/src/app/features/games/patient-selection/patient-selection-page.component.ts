import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

import { PatientContextService } from '../../../core/services/patient-context.service';
import { PatientId, PatientSummary } from '../../../models/patient.model';

interface PatientCardData {
  patient: PatientSummary;
  cardClass: string;
  description: string;
  tags: string[];
}

type Context = 'games' | 'caregiver-professional' | 'caregiver-family';

@Component({
  selector: 'app-patient-selection-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './patient-selection-page.component.html',
  styleUrls: ['./patient-selection-page.component.scss'],
})
export class PatientSelectionPageComponent {
  readonly cards: PatientCardData[] = this.buildCards();
  readonly context: Context = this.getContext();
  isModalOpen = false;
  selectedPatient: PatientCardData | null = null;

  get backButtonText(): string {
    return this.context === 'games' ? '← Accueil' : '← Retour';
  }

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly patientContext: PatientContextService,
  ) {}

  openPatientList(): void {
    this.isModalOpen = true;
  }

  closePatientList(): void {
    this.isModalOpen = false;
  }

  selectPatient(id: PatientId): void {
    this.selectedPatient = this.cards.find(c => c.patient.id === id) ?? null;
    this.closePatientList();
  }

  continue(): void {
    if (!this.selectedPatient) return;
    this.patientContext.setActivePatient(this.selectedPatient.patient.id);

    switch (this.context) {
      case 'games':
        this.router.navigateByUrl('/games');
        break;
      case 'caregiver-professional':
        this.router.navigateByUrl('/caregiver/profile');
        break;
      case 'caregiver-family':
        this.router.navigateByUrl('/caregiver/family-dashboard');
        break;
      default:
        this.router.navigateByUrl('/games');
    }
  }

  goBack(): void {
    switch (this.context) {
      case 'games':
        this.router.navigateByUrl('/');
        break;
      case 'caregiver-professional':
      case 'caregiver-family':
        this.router.navigateByUrl('/caregiver');
        break;
      default:
        this.router.navigateByUrl('/');
    }
  }

  goToProfileManagement(): void {
    this.router.navigate(['/caregiver/profile-management']);
  }

  private getContext(): Context {
    const from = this.route.snapshot.queryParamMap.get('from');
    if (from === 'caregiver-professional') return 'caregiver-professional';
    if (from === 'caregiver-family') return 'caregiver-family';
    return 'games';
  }

  private buildCards(): PatientCardData[] {
    const patients = this.patientContext.getPatients();
    const meta: Record<PatientId, { cardClass: string; description: string; tags: string[] }> = {
      marcel: {
        cardClass: 'card--advance',
        description: 'Sessions très courtes, peu de choix, objets familiers et relances douces.',
        tags: ['Temps court', 'Grandes cibles', 'Routine simple'],
      },
      jean: {
        cardClass: 'card--moderate',
        description: "Associations concrètes, réminiscence accompagnée et séquences de routine avec guidage léger.",
        tags: ['3 choix max', 'Relance discrète', 'Variété modérée'],
      },
      paul: {
        cardClass: 'card--light',
        description: "Séances plus longues, contextes variés et réminiscence plus autonome avec thèmes personnels.",
        tags: ['4 choix possibles', 'Séquences complètes', 'Thèmes porteurs'],
      },
    };
    return patients.map((p) => ({ patient: p, ...meta[p.id] }));
  }
}
