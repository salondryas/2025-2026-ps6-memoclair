import { Component, ElementRef, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { PatientRepositoryMock } from '../../../mocks/patient-repository.mock';
import {
  ClinicalStage,
  GameDifficulty,
  PatientId,
  PatientProfile,
  PatientSummary,
} from '../../../models/patient.model';
import { ManagedProfile, ManagedProfileDraft, ManagedProfileType } from '../../../models/profile.model';
import { CaregiverShellComponent } from '../../../shared/components/layout/caregiver-shell/caregiver-shell.component';
import { PatientContextService } from '../../../core/services/patient-context.service';
import { ProfileSelectionService } from '../services/profile-selection.service';

type ManagementMode = 'professionals' | 'managed';
type ProfileTypeFilter = 'all' | 'patient' | 'professional';

@Component({
  selector: 'app-profile-management-page',
  standalone: true,
  imports: [CommonModule, RouterLink, CaregiverShellComponent, FormsModule],
  templateUrl: './profile-management-page.component.html',
  styleUrl: './profile-management-page.component.scss',
})
export class ProfileManagementPageComponent implements OnInit {
  @ViewChild('photoInput') photoInput!: ElementRef<HTMLInputElement>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private patientRepository: PatientRepositoryMock,
    private patientContextService: PatientContextService,
    private profileSelectionService: ProfileSelectionService,
    private cdr: ChangeDetectorRef
  ) {}

  mode: ManagementMode = 'managed';
  profiles: ManagedProfile[] = [];
  patients: PatientSummary[] = [];
  familyProfiles: ManagedProfile[] = [];
  filteredProfiles: ManagedProfile[] = [];
  returnPath: string = '/games/patient-selection';
  isAddModalOpen = false;
  newProfile: ManagedProfileDraft = this.createEmptyDraft('patient');
  formError = '';
  searchQuery: string = '';
  selectedProfileType: ProfileTypeFilter = 'all';
  selectedStages: string[] = [];
  associationSearchQuery: string = '';
  filteredPatientsForAssociation: PatientSummary[] = [];
  familyAssociationSearchQuery: string = '';
  filteredFamilyProfilesForAssociation: ManagedProfile[] = [];

  private readonly builtInPatientIds = ['marcel', 'jean', 'paul'];
  private activeProfessionalId: string | null = null;
  private readonly brokenAvatarIds = new Set<string>();

  private readonly stageLabels: Record<ClinicalStage, string> = {
    leger: 'Stade léger',
    modere: 'Stade modéré',
    avance: 'Stade avancé',
  };

  private readonly stagePresets: Record<
    ClinicalStage,
    {
      difficulty: GameDifficulty;
      questionCount: number;
      answerCount: number;
      hintDelaySeconds: number;
      attentionSpanMinutes: 5 | 10 | 15 | 20;
    }
  > = {
    leger: { difficulty: 'difficile', questionCount: 15, answerCount: 4, hintDelaySeconds: 30, attentionSpanMinutes: 15 },
    modere: { difficulty: 'moyen', questionCount: 10, answerCount: 3, hintDelaySeconds: 20, attentionSpanMinutes: 10 },
    avance: { difficulty: 'facile', questionCount: 5, answerCount: 2, hintDelaySeconds: 10, attentionSpanMinutes: 5 },
  };

  
  ngOnInit(): void {
    this.mode = this.route.snapshot.data['mode'] === 'professionals' ? 'professionals' : 'managed';
    this.activeProfessionalId = this.profileSelectionService.getActiveProfessionalId();
    this.newProfile = this.createEmptyDraft(this.mode === 'professionals' ? 'professional' : 'patient');
    this.refreshLists();
  }

  get pageTitle(): string {
    return this.mode === 'professionals' ? 'Gérer les profils soignants' : 'Gérer accueillis et aidants familiaux';
  }

  get pageSubtitle(): string {
    return this.mode === 'professionals'
      ? 'Créez les profils qui pourront ouvrir un espace soignant.'
      : 'Créez les profils liés au soignant actif et gérez les associations famille-accueilli.';
  }

  get canChooseProfileType(): boolean {
    return this.mode === 'managed';
  }

  get isFormValid(): boolean {
    const firstName = this.newProfile.firstName.trim();
    const lastName = this.newProfile.lastName.trim();
    if (!firstName || !lastName) return false;

    if (this.newProfile.type === 'professional') {
      return Boolean(this.newProfile.jobTitle.trim() && this.newProfile.organization.trim());
    }

    if (this.newProfile.type === 'patient') {
      return this.newProfile.stage !== '';
    }

    if (this.newProfile.type === 'family') {
      const relationship = this.newProfile.relationship.trim();
      if (!relationship) return false;
      
      // Les aidants familiaux doivent avoir au moins une association
      return this.newProfile.associatedPatientIds.length > 0;
    }

    return true;
  }

  canDelete(profile: ManagedProfile): boolean {
    if (profile.type === 'patient' && this.builtInPatientIds.includes(profile.id)) return false;
    return true;
  }

  deleteProfile(profile: ManagedProfile): void {
    if (!this.canDelete(profile)) return;
    if (!confirm(`Supprimer le profil de ${profile.displayName} ?`)) return;

    this.patientRepository.removeManagedProfile(profile.id);

    if (profile.type === 'professional' && this.activeProfessionalId === profile.id) {
      this.profileSelectionService.clearActiveProfessionalId();
    }

    if (profile.type === 'family' && this.profileSelectionService.getActiveFamilyId() === profile.id) {
      this.profileSelectionService.clearActiveFamilyId();
    }

    this.refreshLists();
  }

  openAddModal(type?: ManagedProfileType): void {
    // Check if no patients exist when trying to add family caregiver
    if (type === 'family' && this.patients.length === 0) {
      this.formError = 'Aucun profil accueilli disponible. Veuillez créer un profil accueilli avant d\'ajouter un aidant familial.';
      return;
    }

    this.isAddModalOpen = true;
    this.formError = '';
    this.newProfile = this.createEmptyDraft(type ?? (this.mode === 'professionals' ? 'professional' : 'patient'));
    
    // Initialize filtered lists for associations
    this.associationSearchQuery = '';
    this.familyAssociationSearchQuery = '';
    this.updateFilteredPatientsForAssociation();
    this.updateFilteredFamilyProfilesForAssociation();
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
    this.formError = '';
    this.newProfile = this.createEmptyDraft(this.mode === 'professionals' ? 'professional' : 'patient');
  }

  changeDraftType(type: ManagedProfileType): void {
    if (this.mode === 'professionals' && type !== 'professional') return;
    this.newProfile = this.createEmptyDraft(type);
  }

  triggerPhotoInput(): void {
    this.photoInput.nativeElement.click();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (file.size > 3 * 1024 * 1024) {
      this.formError = 'La photo ne doit pas dépasser 3 Mo.';
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      this.newProfile.avatarUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  togglePatientAssociation(patientId: PatientId): void {
    this.newProfile.associatedPatientIds = this.toggleId(this.newProfile.associatedPatientIds, patientId);
  }

  toggleFamilyAssociation(familyId: string): void {
    this.newProfile.associatedFamilyIds = this.toggleId(this.newProfile.associatedFamilyIds, familyId);
  }

  isPatientAssociated(patientId: PatientId): boolean {
    return this.newProfile.associatedPatientIds.includes(patientId);
  }

  isFamilyAssociated(familyId: string): boolean {
    return this.newProfile.associatedFamilyIds.includes(familyId);
  }

  submitAddProfile(): void {
    if (!this.isFormValid) {
      this.formError = 'Complétez les informations obligatoires du profil.';
      return;
    }

    // Check if family profile has at least one associated patient
    if (this.newProfile.type === 'family' && this.newProfile.associatedPatientIds.length === 0) {
      this.formError = 'Veuillez associer au moins un accueilli à ce profil aidant.';
      return;
    }

    // Check for duplicate names across all profile types
    const firstName = this.newProfile.firstName.trim().toLowerCase();
    const lastName = this.newProfile.lastName.trim().toLowerCase();
    
    const allProfiles = [
      ...this.patientRepository.getManagedProfiles().filter(profile => profile.type === 'professional'),
      ...this.patientRepository.getManagedProfiles().filter(profile => profile.type === 'family'),
      ...this.patientRepository.getManagedProfiles().filter(profile => profile.type === 'patient')
    ];
    
    const duplicateProfile = allProfiles.find(profile => 
      profile.firstName.trim().toLowerCase() === firstName && 
      profile.lastName.trim().toLowerCase() === lastName
    );
    
    if (duplicateProfile) {
      const typeLabel = duplicateProfile.type === 'professional' ? 'soignant' : 
                       duplicateProfile.type === 'family' ? 'aidant familial' : 'accueilli';
      this.formError = `Un profil ${typeLabel} avec le même nom et prénom existe déjà (${duplicateProfile.displayName}).`;
      return;
    }

    const profile = this.buildManagedProfile();
    const patientProfile = profile.type === 'patient' ? this.buildPatientProfile(profile) : undefined;

    this.patientRepository.addManagedProfile(profile, patientProfile);

    if (profile.type === 'family') {
      this.patientRepository.setFamilyPatientAssociations(profile.id, this.newProfile.associatedPatientIds);
    }

    if (profile.type === 'patient') {
      this.patientRepository.setPatientFamilyAssociations(profile.id, this.newProfile.associatedFamilyIds);
      this.patientContextService.addPatient({
        id: profile.id,
        firstName: profile.firstName,
        displayName: profile.displayName,
        stageLabel: profile.subtitle,
        avatarUrl: profile.avatarUrl,
      }, patientProfile!);
    }

    this.closeAddModal();
    this.refreshLists();
  }

  goBack(): void {
    const from = this.route.snapshot.queryParamMap.get('from');
    if (from === 'professional-selection') {
      void this.router.navigateByUrl('/games/patient-selection?from=caregiver-professional');
      return;
    }
    this.location.back();
  }

  private refreshLists(): void {
    this.patients = this.patientContextService.getPatients();
    this.familyProfiles = this.patientRepository.getFamilyCaregivers();
    this.profiles = this.mode === 'professionals' 
      ? this.patientRepository.getProfessionals()
      : this.patientRepository.getPatientManagedProfiles();
    this.updateFilteredProfiles();
    
    // Initialize filtered association lists
    this.updateFilteredPatientsForAssociation();
    this.updateFilteredFamilyProfilesForAssociation();
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value.toLowerCase();
    this.updateFilteredProfiles();
  }

  onFilterChange(type: ProfileTypeFilter): void {
    this.selectedProfileType = type;
    this.selectedStages = type === 'patient' ? this.selectedStages : [];
    this.cdr.detectChanges();
    this.updateFilteredProfiles();
    queueMicrotask(() => this.cdr.detectChanges());
  }

  hasProfileAvatar(profile: ManagedProfile): boolean {
    return Boolean(profile.avatarUrl && !this.brokenAvatarIds.has(profile.id));
  }

  markAvatarBroken(profileId: string): void {
    this.brokenAvatarIds.add(profileId);
    this.cdr.detectChanges();
  }

  toggleStage(stage: string): void {
    const index = this.selectedStages.indexOf(stage);
    if (index > -1) {
      this.selectedStages.splice(index, 1);
    } else {
      this.selectedStages.push(stage);
    }
    this.updateFilteredProfiles();
  }

  onAssociationSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.associationSearchQuery = target.value.toLowerCase();
    this.updateFilteredPatientsForAssociation();
  }

  private updateFilteredPatientsForAssociation(): void {
    if (!this.associationSearchQuery) {
      this.filteredPatientsForAssociation = this.patients;
    } else {
      this.filteredPatientsForAssociation = this.patients.filter(patient => 
        patient.firstName.toLowerCase().includes(this.associationSearchQuery) ||
        patient.displayName.toLowerCase().includes(this.associationSearchQuery)
      );
    }
  }

  onFamilyAssociationSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.familyAssociationSearchQuery = target.value.toLowerCase();
    this.updateFilteredFamilyProfilesForAssociation();
  }

  private updateFilteredFamilyProfilesForAssociation(): void {
    if (!this.familyAssociationSearchQuery) {
      this.filteredFamilyProfilesForAssociation = this.familyProfiles;
    } else {
      this.filteredFamilyProfilesForAssociation = this.familyProfiles.filter(family => 
        family.firstName.toLowerCase().includes(this.familyAssociationSearchQuery) ||
        family.displayName.toLowerCase().includes(this.familyAssociationSearchQuery)
      );
    }
  }

  private updateFilteredProfiles(): void {
    let profiles = this.mode === 'professionals'
      ? this.patientRepository.getProfessionals()
      : this.patientRepository.getManagedProfiles();

    // Apply search filter
    if (this.searchQuery) {
      profiles = profiles.filter(profile =>
        profile.firstName.toLowerCase().includes(this.searchQuery) ||
        profile.displayName.toLowerCase().includes(this.searchQuery)
      );
    }

    profiles = profiles.filter(profile => {
      if (this.mode === 'professionals') return true;
      if (this.selectedProfileType === 'all') return true;
      return profile.type === this.selectedProfileType;
    });

    if (this.selectedProfileType === 'patient' && this.selectedStages.length > 0) {
      profiles = profiles.filter(profile => {
        const patient = this.patients.find(p => p.id === profile.id);
        if (patient) {
          let stageKey = '';
          if (patient.stageLabel === 'Stade léger') stageKey = 'leger';
          else if (patient.stageLabel === 'Stade modéré') stageKey = 'modere';
          else if (patient.stageLabel === 'Stade avancé') stageKey = 'avance';
          
          return this.selectedStages.includes(stageKey);
        }
        return false;
      });
    }

    this.filteredProfiles = profiles;
  }

  private buildManagedProfile(): ManagedProfile {
    const firstName = this.newProfile.firstName.trim();
    const lastName = this.newProfile.lastName.trim();
    const id = `${this.newProfile.type}-${firstName.toLowerCase().replace(/\s+/g, '')}-${Date.now()}`;

    return {
      id,
      type: this.newProfile.type,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      subtitle: this.buildSubtitle(),
      avatarUrl: this.newProfile.avatarUrl || undefined,
      createdByProfessionalId: this.newProfile.type === 'professional' ? undefined : this.activeProfessionalId ?? undefined,
      stage: this.newProfile.stage || undefined,
      jobTitle: this.newProfile.jobTitle.trim() || undefined,
      organization: this.newProfile.organization.trim() || undefined,
      relationship: this.newProfile.relationship.trim() || undefined,
      email: this.newProfile.email.trim() || undefined,
      phone: this.newProfile.phone.trim() || undefined,
    };
  }

  private buildSubtitle(): string {
    if (this.newProfile.type === 'professional') {
      return `${this.newProfile.jobTitle.trim()} · ${this.newProfile.organization.trim()}`;
    }

    if (this.newProfile.type === 'patient') {
      return this.stageLabels[this.newProfile.stage as ClinicalStage];
    }

    return `Aidant familial · ${this.newProfile.relationship.trim()}`;
  }

  private buildPatientProfile(profile: ManagedProfile): PatientProfile {
    const stage = profile.stage ?? 'leger';
    const preset = this.stagePresets[stage];

    return {
      patientId: profile.id,
      stage,
      vision: 'leger',
      motor: 'leger',
      themes: ['quotidien'],
      attentionSpanMinutes: preset.attentionSpanMinutes,
      difficulty: preset.difficulty,
      questionCount: preset.questionCount,
      answerCount: preset.answerCount,
      hintDelaySeconds: preset.hintDelaySeconds,
      audioReadingEnabled: true,
      highContrastEnabled: false,
      textSize: 1,
      updatedAt: null,
    };
  }

  private createEmptyDraft(type: ManagedProfileType): ManagedProfileDraft {
    return {
      type,
      firstName: '',
      lastName: '',
      stage: '',
      avatarUrl: '',
      jobTitle: '',
      organization: '',
      relationship: '',
      email: '',
      phone: '',
      associatedPatientIds: [],
      associatedFamilyIds: [],
    };
  }

  private toggleId<TId extends string>(ids: TId[], id: TId): TId[] {
    return ids.includes(id) ? ids.filter((entry) => entry !== id) : [...ids, id];
  }
}
