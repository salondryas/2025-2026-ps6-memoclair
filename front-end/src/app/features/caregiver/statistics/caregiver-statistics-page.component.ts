import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  Battery,
  Clock,
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
  MessageCircle,
  Smile,
} from 'lucide-angular';

import { PatientContextService } from '../../../core/services/patient-context.service';
import { PatientId, PatientSummary } from '../../../models/patient.model';
import { CaregiverShellComponent } from '../../../shared/components/layout/caregiver-shell/caregiver-shell.component';

type MoodTone = 'positive' | 'calm' | 'alert';
type AutonomyTone = 'strong' | 'medium' | 'supported';

interface MoodKpi {
  label: string;
  detail: string;
  tone: MoodTone;
  percent: number;
  trend: string;
}

interface AutonomyKpi {
  label: string;
  detail: string;
  tone: AutonomyTone;
  percent: number;
  helperLoad: string;
}

interface EngagementKpi {
  weeklyMinutes: number;
  sessionsDone: number;
  sessionsGoal: number;
  percent: number;
  detail: string;
}

interface FavoriteTheme {
  label: string;
  percent: number;
  color: string;
  prompt: string;
}

interface RecentSession {
  dateLabel: string;
  mood: string;
  autonomy: string;
  engagement: string;
  theme: string;
}

interface CaregiverDashboardKpis {
  mood: MoodKpi;
  autonomy: AutonomyKpi;
  engagement: EngagementKpi;
  favoriteThemes: FavoriteTheme[];
  recentSessions: RecentSession[];
  quickTip: string;
}

@Component({
  selector: 'app-caregiver-statistics-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CaregiverShellComponent, LucideAngularModule],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ Smile, Battery, Clock, MessageCircle }),
    },
  ],
  templateUrl: './caregiver-statistics-page.component.html',
  styleUrls: ['./caregiver-statistics-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaregiverStatisticsPageComponent implements OnInit, OnDestroy {
  patients: PatientSummary[] = [];
  selectedPatientId!: PatientId;
  currentPatient!: PatientSummary;
  dashboard!: CaregiverDashboardKpis;

  private patientSubscription?: Subscription;

  private readonly mockDashboards: Record<string, CaregiverDashboardKpis> = {
    default: {
      mood: {
        label: 'Joyeux',
        detail: 'Sort de séance souriant, échange volontiers avec le groupe.',
        tone: 'positive',
        percent: 82,
        trend: '+2 séances positives cette semaine',
      },
      autonomy: {
        label: 'A joué seul',
        detail: 'Lance les manches avec une simple consigne de départ.',
        tone: 'strong',
        percent: 76,
        helperLoad: 'Charge accompagnant faible',
      },
      engagement: {
        weeklyMinutes: 42,
        sessionsDone: 3,
        sessionsGoal: 4,
        percent: 75,
        detail: 'Participation régulière aux animations mémoire.',
      },
      favoriteThemes: [
        { label: 'Animaux', percent: 88, color: '#6b8f71', prompt: 'Parler des chiens, chats ou oiseaux connus.' },
        { label: 'Cuisine', percent: 72, color: '#d4a96a', prompt: 'Demander une recette ou un plat préféré.' },
        { label: 'Jardin', percent: 54, color: '#7b9fd4', prompt: 'Évoquer les fleurs, saisons ou potager.' },
      ],
      recentSessions: [
        { dateLabel: 'Aujourd’hui', mood: 'Joyeux', autonomy: '1 indice', engagement: '16 min', theme: 'Animaux' },
        { dateLabel: 'Mardi', mood: 'Calme', autonomy: 'Autonome', engagement: '14 min', theme: 'Cuisine' },
        { dateLabel: 'Lundi', mood: 'Joyeux', autonomy: '2 indices', engagement: '12 min', theme: 'Jardin' },
      ],
      quickTip: 'Prévoir une activité courte autour des animaux : c’est le sujet qui déclenche le plus facilement la parole.',
    },
    marcel: {
      mood: {
        label: 'Calme',
        detail: 'Reste apaisé après les jeux, surtout en petit groupe.',
        tone: 'calm',
        percent: 74,
        trend: 'Stabilité observée sur 3 séances',
      },
      autonomy: {
        label: 'A eu besoin de 2 indices',
        detail: 'Réussit mieux quand l’animateur reformule la première consigne.',
        tone: 'medium',
        percent: 58,
        helperLoad: 'Présence ponctuelle conseillée',
      },
      engagement: {
        weeklyMinutes: 35,
        sessionsDone: 3,
        sessionsGoal: 4,
        percent: 68,
        detail: 'Participe davantage en fin de matinée.',
      },
      favoriteThemes: [
        { label: 'Cuisine', percent: 84, color: '#d4a96a', prompt: 'Faire raconter un repas de famille.' },
        { label: 'Chansons', percent: 69, color: '#9b7fd4', prompt: 'Lancer un refrain connu pour ouvrir l’échange.' },
        { label: 'Animaux', percent: 61, color: '#6b8f71', prompt: 'Montrer une photo d’animal domestique.' },
      ],
      recentSessions: [
        { dateLabel: 'Aujourd’hui', mood: 'Calme', autonomy: '2 indices', engagement: '13 min', theme: 'Cuisine' },
        { dateLabel: 'Mercredi', mood: 'Joyeux', autonomy: '1 indice', engagement: '12 min', theme: 'Chansons' },
        { dateLabel: 'Lundi', mood: 'Calme', autonomy: 'Guidage verbal', engagement: '10 min', theme: 'Animaux' },
      ],
      quickTip: 'Commencer par une question de cuisine aide à installer une ambiance sereine avant le jeu.',
    },
    jean: {
      mood: {
        label: 'Agité',
        detail: 'Besoin de pauses courtes quand la séance dure plus de 10 minutes.',
        tone: 'alert',
        percent: 46,
        trend: 'Préférer les créneaux courts',
      },
      autonomy: {
        label: 'Accompagnement rapproché',
        detail: 'A besoin que l’animateur reste à côté pour relancer l’activité.',
        tone: 'supported',
        percent: 42,
        helperLoad: 'Charge accompagnant élevée',
      },
      engagement: {
        weeklyMinutes: 24,
        sessionsDone: 2,
        sessionsGoal: 4,
        percent: 50,
        detail: 'S’engage mieux avec un binôme connu.',
      },
      favoriteThemes: [
        { label: 'Bricolage', percent: 79, color: '#7b9fd4', prompt: 'Parler d’outils ou de réparations simples.' },
        { label: 'Voyages', percent: 63, color: '#6b8f71', prompt: 'Demander un lieu visité ou une ville aimée.' },
        { label: 'Cuisine', percent: 47, color: '#d4a96a', prompt: 'Évoquer un gâteau ou une odeur de cuisine.' },
      ],
      recentSessions: [
        { dateLabel: 'Jeudi', mood: 'Agité', autonomy: 'Guidage verbal', engagement: '9 min', theme: 'Bricolage' },
        { dateLabel: 'Mardi', mood: 'Calme', autonomy: '2 indices', engagement: '15 min', theme: 'Voyages' },
        { dateLabel: 'Lundi', mood: 'Agité', autonomy: 'Accompagné', engagement: '0 min', theme: 'Cuisine' },
      ],
      quickTip: 'Installer le patient avec un pair rassurant et limiter la première activité à 10 minutes.',
    },
  };

  constructor(
    private readonly patientContextService: PatientContextService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.patients = this.patientContextService.getPatients();
    this.selectedPatientId = this.patientContextService.getActivePatientSnapshot().id;
    this.refreshPage(this.selectedPatientId);

    this.patientSubscription = this.patientContextService.activePatient$.subscribe((patient) => {
      this.selectedPatientId = patient.id;
      this.refreshPage(patient.id);
    });
  }

  onPatientChange(patientId: string): void {
    const id = patientId as PatientId;
    this.patientContextService.setActivePatient(id);
    this.selectedPatientId = id;
    this.refreshPage(id);
  }

  trackByTheme(_: number, item: FavoriteTheme): string {
    return item.label;
  }

  trackBySession(_: number, item: RecentSession): string {
    return `${item.dateLabel}-${item.theme}`;
  }

  ngOnDestroy(): void {
    this.patientSubscription?.unsubscribe();
  }

  private refreshPage(patientId: PatientId): void {
    this.currentPatient = this.patientContextService.getActivePatientSnapshot();
    this.dashboard = this.mockDashboards[patientId] ?? this.mockDashboards['default'];
    this.cdr.markForCheck();
  }
}
