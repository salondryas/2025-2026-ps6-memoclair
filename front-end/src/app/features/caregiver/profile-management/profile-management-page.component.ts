import { Component, ElementRef, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { PatientRepositoryMock } from '../../../mocks/patient-repository.mock';
import {
  ClinicalStage,
  DEFAULT_PROFILE_OBJECTIVES,
  GameDifficulty,
  PatientId,
  PatientProfile,
  PatientSummary,
} from '../../../models/patient.model';
import { ManagedProfile, ManagedProfileDraft, ManagedProfileType } from '../../../models/profile.model';
import { PatientContextService } from '../../../core/services/patient-context.service';
import { ProfileSelectionService } from '../services/profile-selection.service';

type ManagementMode = 'professionals' | 'managed';

@Component({
  selector: 'app-profile-management-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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
  filteredFamilyProfiles: ManagedProfile[] = [];
  filteredPatientProfiles: ManagedProfile[] = [];
  returnPath: string = '/games/patient-selection';
  isAddModalOpen = false;
  newProfile: ManagedProfileDraft = this.createEmptyDraft('patient');
  formError = '';
  searchQuery: string = '';
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

    const action = this.route.snapshot.queryParamMap.get('action');
    const type = this.route.snapshot.queryParamMap.get('type') as ManagedProfileType | null;
    if (action === 'add') {
      this.openAddModal(type ?? undefined);
    }
  }

  get pageTitle(): string {
    return this.mode === 'professionals' ? 'Gérer les profils soignants' : 'Gérer accueillis et aidants familiaux';
  }

  get pageSubtitle(): string {
    return this.mode === 'professionals'
      ? 'Créez les profils qui pourront ouvrir un espace soignant.'
      : 'Créez les profils liés au soignant actif et gérez les associations famille-accueilli.';
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
      return Boolean(this.newProfile.relationship.trim());
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

  chainMessage = '';

  openAddModal(type?: ManagedProfileType): void {
    this.isAddModalOpen = true;
    this.formError = '';
    this.newProfile = this.createEmptyDraft(type ?? (this.mode === 'professionals' ? 'professional' : 'patient'));
    this.associationSearchQuery = '';
    this.familyAssociationSearchQuery = '';
    this.filteredPatientsForAssociation = [...this.patients];
    this.filteredFamilyProfilesForAssociation = [...this.familyProfiles];
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
    this.formError = '';
    this.chainMessage = '';
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

    const familyCreatedWithoutPatient =
      profile.type === 'family' && this.newProfile.associatedPatientIds.length === 0;

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

    if (familyCreatedWithoutPatient) {
      this.chainMessage = `Aidant "${profile.displayName}" créé. Ajoutez maintenant un accueilli à lui associer.`;
      this.openAddModal('patient');
    } else {
      this.chainMessage = '';
    }
  }

  goBack(): void {
    void this.router.navigate(['/games/patient-selection-patient'], { queryParams: { from: 'caregiver-professional' } });
  }

  private refreshLists(): void {
    this.patients = this.patientContextService.getPatients();
    this.familyProfiles = this.patientRepository.getFamilyCaregivers();
    this.profiles = this.mode === 'professionals'
      ? this.patientRepository.getProfessionals()
      : this.patientRepository.getPatientManagedProfiles();
    this.updateFilteredProfiles();
    this.filteredPatientsForAssociation = [...this.patients];
    this.filteredFamilyProfilesForAssociation = [...this.familyProfiles];
  }

  onSearchChange(query: string): void {
    this.updateFilteredProfiles();
  }

  hasProfileAvatar(profile: ManagedProfile): boolean {
    return Boolean(profile.avatarUrl && !this.brokenAvatarIds.has(profile.id));
  }

  markAvatarBroken(profileId: string): void {
    this.brokenAvatarIds.add(profileId);
    this.cdr.detectChanges();
  }

  onAssociationSearchChange(query: string): void {
    const q = query.toLowerCase();
    this.filteredPatientsForAssociation = q
      ? this.patients.filter(p =>
          p.firstName.toLowerCase().includes(q) ||
          p.displayName.toLowerCase().includes(q)
        )
      : [...this.patients];
    this.cdr.detectChanges();
  }

  onFamilyAssociationSearchChange(query: string): void {
    const q = query.toLowerCase();
    this.filteredFamilyProfilesForAssociation = q
      ? this.familyProfiles.filter(f =>
          f.firstName.toLowerCase().includes(q) ||
          f.lastName.toLowerCase().includes(q) ||
          f.displayName.toLowerCase().includes(q)
        )
      : [...this.familyProfiles];
    this.cdr.detectChanges();
  }

  private updateFilteredProfiles(): void {
    const q = this.searchQuery.toLowerCase();

    const matchesSearch = (profile: ManagedProfile): boolean =>
      !q ||
      profile.firstName.toLowerCase().includes(q) ||
      profile.lastName.toLowerCase().includes(q) ||
      profile.displayName.toLowerCase().includes(q);

    if (this.mode === 'professionals') {
      this.filteredProfiles = this.patientRepository.getProfessionals().filter(matchesSearch);
      return;
    }

    const allManaged = this.patientRepository.getManagedProfiles();
    this.filteredFamilyProfiles = allManaged.filter(p => p.type === 'family' && matchesSearch(p));
    this.filteredPatientProfiles = allManaged.filter(p => p.type === 'patient' && matchesSearch(p));
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
      maxHintsPerQuestion: 2,
      maxHintsPerSession: 15,
      answerNextSeconds: 5,
      inactionNextSeconds: 20,
      autoNextMode: '5s',
      audioReadingEnabled: true,
      highContrastEnabled: false,
      textSize: 1,
      objectives: { ...DEFAULT_PROFILE_OBJECTIVES },
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
