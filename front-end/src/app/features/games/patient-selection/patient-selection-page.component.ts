import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { PatientContextService } from '../../../core/services/patient-context.service';
import { PatientRepositoryMock } from '../../../mocks/patient-repository.mock';
import { PatientId, PatientSummary } from '../../../models/patient.model';
import { ManagedProfile } from '../../../models/profile.model';
import { ProfileSelectionService } from '../../caregiver/services/profile-selection.service';

interface PatientCardData {
  patient: PatientSummary;
  cardClass: string;
  description: string;
  tags: string[];
}

interface ProfileCardData {
  profile: ManagedProfile;
  cardClass: string;
  description: string;
  tags: string[];
}

type Context = 'games' | 'caregiver-professional' | 'caregiver-family';
type SelectionStep = 'professional' | 'family' | 'patient';

interface EdgeCaseDialog {
  title: string;
  message: string;
  primaryLabel: string;
  primaryRoute: string;
}

@Component({
  selector: 'app-patient-selection-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './patient-selection-page.component.html',
  styleUrls: ['./patient-selection-page.component.scss'],
})
export class PatientSelectionPageComponent implements OnInit {
  cards: PatientCardData[] = [];
  professionalCards: ProfileCardData[] = [];
  familyCards: ProfileCardData[] = [];
  readonly context: Context = this.getContext();

  activeStep: SelectionStep = 'patient';
  isModalOpen = false;
  edgeCaseDialog: EdgeCaseDialog | null = null;
  selectedPatient: PatientCardData | null = null;
  selectedProfessional: ProfileCardData | null = null;
  selectedFamily: ProfileCardData | null = null;
  searchQuery: string = '';
  filteredCards: PatientCardData[] = [];
  filteredProfessionalCards: ProfileCardData[] = [];
  filteredFamilyCards: ProfileCardData[] = [];
  private readonly brokenAvatarKeys = new Set<string>();

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly patientContext: PatientContextService,
    private readonly patientRepository: PatientRepositoryMock,
    private readonly profileSelection: ProfileSelectionService,
  ) {}

  ngOnInit(): void {
    this.professionalCards = this.buildProfessionalCards();
    this.familyCards = this.buildFamilyCards();
    this.cards = this.buildPatientCards();
    
    // Charger les dernières sélections
    this.loadLastSelections();
    
    // Logique simplifiée basée sur le path de la route
    const currentPath = this.route.snapshot.routeConfig?.path;
    
    if (currentPath === 'patient-selection-patient') {
      this.activeStep = 'patient';
    } else {
      // patient-selection (path principal)
      this.activeStep = this.context === 'caregiver-professional'
        ? 'professional'
        : this.context === 'caregiver-family'
          ? 'family'
          : 'patient';
    }
    
    this.evaluateEdgeCases();
    this.initializeFilteredLists();
  }

  get backButtonText(): string {
    return this.context === 'games' ? '← Accueil' : '← Retour';
  }

  get selectionTitle(): string {
    if (this.context === 'caregiver-professional') {
      return this.activeStep === 'professional' ? 'Quel soignant ?' : 'Quel accueilli ?';
    }
    if (this.context === 'caregiver-family') {
      return this.activeStep === 'family' ? 'Quel aidant familial ?' : 'Quel accueilli ?';
    }
    return 'Pour qui ?';
  }

  get cardName(): string {
    if (this.activeStep === 'professional') return this.selectedProfessional?.profile.firstName ?? 'Choisir un soignant';
    if (this.activeStep === 'family') return this.selectedFamily?.profile.firstName ?? 'Choisir un aidant familial';
    return this.selectedPatient?.patient.firstName ?? 'Choisir un accueilli';
  }

  get cardSubtitle(): string {
    if (this.activeStep === 'professional') return this.selectedProfessional ? 'Profil soignant sélectionné' : 'Sélectionnez un soignant enregistré';
    if (this.activeStep === 'family') return this.selectedFamily ? 'Profil aidant familial sélectionné' : 'Sélectionnez un aidant familial enregistré';
    return this.selectedPatient ? 'Profil accueilli sélectionné' : 'Sélectionnez un profil parmi la liste';
  }

  get cardClass(): string | null {
    if (this.activeStep === 'professional') return this.selectedProfessional?.cardClass ?? null;
    if (this.activeStep === 'family') return this.selectedFamily?.cardClass ?? null;
    return this.selectedPatient?.cardClass ?? null;
  }

  get selectedInitial(): string {
    return this.cardName[0] ?? '?';
  }

  get selectedAvatarUrl(): string | undefined {
    if (this.selectedPatient?.patient) {
      return this.hasPatientAvatar(this.selectedPatient.patient) ? this.selectedPatient.patient.avatarUrl : undefined;
    }
    if (this.selectedProfessional?.profile) {
      return this.hasProfileAvatar(this.selectedProfessional.profile) ? this.selectedProfessional.profile.avatarUrl : undefined;
    }
    if (this.selectedFamily?.profile) {
      return this.hasProfileAvatar(this.selectedFamily.profile) ? this.selectedFamily.profile.avatarUrl : undefined;
    }
    return undefined;
  }

  hasProfileAvatar(profile: ManagedProfile): boolean {
    return Boolean(profile.avatarUrl && !this.brokenAvatarKeys.has(`profile:${profile.id}`));
  }

  hasPatientAvatar(patient: PatientSummary): boolean {
    return Boolean(patient.avatarUrl && !this.brokenAvatarKeys.has(`patient:${patient.id}`));
  }

  markProfileAvatarBroken(profileId: string): void {
    this.brokenAvatarKeys.add(`profile:${profileId}`);
  }

  markPatientAvatarBroken(patientId: PatientId): void {
    this.brokenAvatarKeys.add(`patient:${patientId}`);
  }

  get primaryButtonLabel(): string {
    if (!this.hasSelectionForStep()) {
      if (this.activeStep === 'professional') return 'Voir les soignants';
      if (this.activeStep === 'family') return 'Voir les aidants familiaux';
      return 'Voir les accueillis';
    }
    return this.canContinueDirectly() ? 'Continuer' : 'Choisir l’accueilli';
  }

  openPatientList(): void {
    this.isModalOpen = true;
  }

  closePatientList(): void {
    this.isModalOpen = false;
  }

  selectPatient(id: PatientId): void {
    this.selectedPatient = this.cards.find((card) => card.patient.id === id) ?? null;
    if (this.selectedPatient) {
      this.saveLastSelection('patient', this.selectedPatient.patient.id);
    }
    this.closePatientList();
  }

  selectProfessional(id: string): void {
    this.selectedProfessional = this.professionalCards.find((card) => card.profile.id === id) ?? null;
    this.closePatientList();
    if (this.selectedProfessional) {
      this.saveLastSelection('professional', this.selectedProfessional.profile.id);
      this.profileSelection.setActiveProfessionalId(this.selectedProfessional.profile.id);
      this.activeStep = 'patient';
    }
  }

  selectFamily(id: string): void {
    this.selectedFamily = this.familyCards.find((card) => card.profile.id === id) ?? null;
    this.closePatientList();
    if (this.selectedFamily) {
      this.saveLastSelection('family', this.selectedFamily.profile.id);
      this.profileSelection.setActiveFamilyId(this.selectedFamily.profile.id);
      this.cards = this.buildPatientCardsForFamily(this.selectedFamily.profile.id);
      if (this.cards.length === 0) {
        this.edgeCaseDialog = {
          title: 'Aucun accueilli associé',
          message: 'Ce profil familial existe, mais aucun accueilli ne lui est encore attribué. Demandez à un soignant de lui associer au moins un accueilli.',
          primaryLabel: 'OK',
          primaryRoute: '/caregiver',
        };
        return;
      }
      this.activeStep = 'patient';
    }
  }

  handlePrimaryAction(): void {
    if (!this.hasSelectionForStep()) {
      // Pour caregiver-family à l'étape family, ouvrir la modal des aidants familiaux
      if (this.context === 'caregiver-family' && this.activeStep === 'family') {
        this.openPatientList();
        return;
      }
      // Pour caregiver-professional à l'étape professional, ouvrir la modal des soignants
      if (this.context === 'caregiver-professional' && this.activeStep === 'professional') {
        this.openPatientList();
        return;
      }
      // Si on est déjà à l'étape patient sans sélection, ouvrir la modal
      this.openPatientList();
      return;
    }

    if (this.canContinueDirectly()) {
      this.continue();
      return;
    }

    // Naviguer vers la page de sélection des patients
    const fromParam = this.context === 'caregiver-family' ? '?from=caregiver-family' : 
                      this.context === 'caregiver-professional' ? '?from=caregiver-professional' : '';
    void this.router.navigateByUrl(`/games/patient-selection-patient${fromParam}`);
  }

  continue(): void {
    if (!this.selectedPatient) return;
    this.patientContext.setActivePatient(this.selectedPatient.patient.id);

    switch (this.context) {
      case 'games':
        void this.router.navigateByUrl('/games');
        break;
      case 'caregiver-professional':
        void this.router.navigateByUrl('/caregiver/profile');
        break;
      case 'caregiver-family':
        void this.router.navigateByUrl('/caregiver/family-dashboard');
        break;
    }
  }

  goBack(): void {
    // Si on est sur la route patient-selection-patient, revenir à la route principale
    const currentPath = this.route.snapshot.routeConfig?.path;
    if (currentPath === 'patient-selection-patient') {
      if (this.context === 'caregiver-family') {
        this.router.navigateByUrl('/games/patient-selection?from=caregiver-family');
        return;
      }
      if (this.context === 'caregiver-professional') {
        this.router.navigateByUrl('/games/patient-selection?from=caregiver-professional');
        return;
      }
    }
    
    // Pour la route principale patient-selection
    if (currentPath === 'patient-selection') {
      // Pour caregiver-professional, toujours rediriger vers role-selection
      if (this.context === 'caregiver-professional') {
        void this.router.navigateByUrl('/caregiver/role-selection');
        return;
      }
      // Pour games, rediriger vers la home page
      if (this.context === 'games') {
        void this.router.navigateByUrl('/');
        return;
      }
      // Pour caregiver-family, rediriger vers la page de sélection de rôle
      void this.router.navigateByUrl('/caregiver/role-selection');
      return;
    }
    
    // Rediriger selon le contexte par défaut
    if (this.context === 'games') {
      void this.router.navigateByUrl('/');
      return;
    }
    void this.router.navigateByUrl('/caregiver/role-selection');
  }

  closeEdgeCaseDialog(): void {
    if (!this.edgeCaseDialog) return;
    const route = this.edgeCaseDialog.primaryRoute;
    this.edgeCaseDialog = null;
    void this.router.navigateByUrl(route);
  }

  private evaluateEdgeCases(): void {
    if (this.context === 'games' && this.cards.length === 0) {
      this.edgeCaseDialog = {
        title: 'Aucun profil accueilli',
        message: 'Aucun profil accueilli n’est encore disponible. Demandez au soignant référent de créer un profil avant de lancer une séance.',
        primaryLabel: 'OK',
        primaryRoute: '/',
      };
      return;
    }

    if (this.context === 'caregiver-professional' && this.professionalCards.length === 0) {
      this.edgeCaseDialog = {
        title: 'Créer un profil soignant',
        message: 'Aucun profil soignant n’est encore enregistré. Créez un soignant avant d’ouvrir l’espace professionnel.',
        primaryLabel: 'Créer un soignant',
        primaryRoute: '/caregiver/professional-profile-management?from=professional-selection',
      };
      return;
    }

    if (this.context === 'caregiver-professional' && this.cards.length === 0) {
      this.edgeCaseDialog = {
        title: 'Créer un profil accueilli',
        message: 'Un profil soignant existe, mais aucun accueilli n’est encore enregistré.',
        primaryLabel: 'Créer un accueilli',
        primaryRoute: '/caregiver/profile-management?from=professional-selection',
      };
      return;
    }

    if (this.context === 'caregiver-family' && this.familyCards.length === 0) {
      this.edgeCaseDialog = {
        title: 'Aucun profil familial',
        message: 'Aucun profil d’aidant familial n’a encore été créé. Demandez à un soignant de créer votre profil.',
        primaryLabel: 'OK',
        primaryRoute: '/caregiver',
      };
    }
  }

  private getContext(): Context {
    const from = this.route.snapshot.queryParamMap.get('from');
    if (from === 'caregiver-professional') return 'caregiver-professional';
    if (from === 'caregiver-family') return 'caregiver-family';
    return 'games';
  }

  private buildProfessionalCards(): ProfileCardData[] {
    return this.patientRepository.getProfessionals().map((profile) => ({
      profile,
      cardClass: 'card--moderate',
      description: profile.subtitle,
      tags: ['Soignant', profile.organization ?? 'Établissement'],
    }));
  }

  private buildFamilyCards(): ProfileCardData[] {
    return this.patientRepository.getFamilyCaregivers().map((profile) => ({
      profile,
      cardClass: 'card--light',
      description: profile.subtitle,
      tags: ['Famille', profile.relationship ?? 'Proche'],
    }));
  }

  private buildPatientCards(): PatientCardData[] {
    let patients = this.patientContext.getPatients();
    
    // Filtrer les patients selon le contexte
    if (this.context === 'caregiver-professional' && this.selectedProfessional) {
      // N'afficher que les patients associés au soignant sélectionné
      const professionalAssociations = this.patientRepository.getPatientAssociations(this.selectedProfessional.profile.id);
      const associatedPatientIds = professionalAssociations.map(assoc => assoc.patientId);
      patients = patients.filter(patient => associatedPatientIds.includes(patient.id));
    } else if (this.context === 'caregiver-family' && this.selectedFamily) {
      // N'afficher que les patients responsables familiaux de l'aidant sélectionné
      const familyAssociations = this.patientRepository.getFamilyAssociations(this.selectedFamily.profile.id);
      const associatedPatientIds = familyAssociations.map(assoc => assoc.patientId);
      patients = patients.filter(patient => associatedPatientIds.includes(patient.id));
    }
    
    return this.mapPatientsToCards(patients);
  }

  private buildPatientCardsForFamily(familyId: string): PatientCardData[] {
    return this.mapPatientsToCards(this.patientRepository.getPatientsForFamily(familyId));
  }

  private mapPatientsToCards(patients: PatientSummary[]): PatientCardData[] {
    const stageToCardClass: Record<string, string> = {
      'Stade avancé': 'card--advance',
      'Stade modéré': 'card--moderate',
      'Stade léger': 'card--light',
    };

    return patients.map((patient) => ({
      patient,
      cardClass: stageToCardClass[patient.stageLabel] ?? 'card--light',
      description: `Profil — ${patient.stageLabel}`,
      tags: [patient.stageLabel],
    }));
  }

  hasSelectionForStep(): boolean {
    if (this.activeStep === 'professional') return Boolean(this.selectedProfessional);
    if (this.activeStep === 'family') return Boolean(this.selectedFamily);
    return Boolean(this.selectedPatient);
  }

  private canContinueDirectly(): boolean {
    return this.activeStep === 'patient' && Boolean(this.selectedPatient);
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value.toLowerCase();
    this.updateFilteredLists();
  }

  private initializeFilteredLists(): void {
    this.filteredCards = [...this.cards];
    this.filteredProfessionalCards = [...this.professionalCards];
    this.filteredFamilyCards = [...this.familyCards];
  }

  private updateFilteredLists(): void {
    this.filteredCards = this.cards.filter(card => 
      card.patient.firstName.toLowerCase().includes(this.searchQuery) ||
      card.patient.displayName.toLowerCase().includes(this.searchQuery)
    );
    this.filteredProfessionalCards = this.professionalCards.filter(card =>
      card.profile.firstName.toLowerCase().includes(this.searchQuery) ||
      card.profile.lastName.toLowerCase().includes(this.searchQuery)
    );
    this.filteredFamilyCards = this.familyCards.filter(card =>
      card.profile.firstName.toLowerCase().includes(this.searchQuery) ||
      card.profile.lastName.toLowerCase().includes(this.searchQuery)
    );
  }

  private loadLastSelections(): void {
    // Charger les dernières sélections depuis localStorage
    const lastProfessionalId = localStorage.getItem('last-selected-professional');
    const lastFamilyId = localStorage.getItem('last-selected-family');
    const lastPatientId = localStorage.getItem('last-selected-patient');

    if (lastProfessionalId) {
      this.selectedProfessional = this.professionalCards.find(card => card.profile.id === lastProfessionalId) || null;
    }
    if (lastFamilyId) {
      this.selectedFamily = this.familyCards.find(card => card.profile.id === lastFamilyId) || null;
    }
    if (lastPatientId) {
      this.selectedPatient = this.cards.find(card => card.patient.id === lastPatientId) || null;
    }
  }

  private saveLastSelection(type: 'professional' | 'family' | 'patient', id: string): void {
    localStorage.setItem(`last-selected-${type}`, id);
  }

  clearSelection(type: 'professional' | 'family' | 'patient'): void {
    switch (type) {
      case 'professional':
        this.selectedProfessional = null;
        localStorage.removeItem('last-selected-professional');
        break;
      case 'family':
        this.selectedFamily = null;
        localStorage.removeItem('last-selected-family');
        break;
      case 'patient':
        this.selectedPatient = null;
        localStorage.removeItem('last-selected-patient');
        break;
    }
  }

  clearCurrentSelection(): void {
    switch (this.activeStep) {
      case 'professional':
        this.clearSelection('professional');
        break;
      case 'family':
        this.clearSelection('family');
        break;
      case 'patient':
        this.clearSelection('patient');
        break;
    }
  }
}
