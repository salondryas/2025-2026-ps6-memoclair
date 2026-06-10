import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CaregiverRole } from '../../../models/caregiver-role.model';
import { CaregiverRoleService } from '../services/caregiver-role.service';

@Component({
  selector: 'app-caregiver-role-selection-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './caregiver-role-selection-page.component.html',
  styleUrl: './caregiver-role-selection-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaregiverRoleSelectionPageComponent implements OnInit {
  showForgetChoice = false;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly caregiverRoleService: CaregiverRoleService,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // On affiche toujours la page de sélection de rôle sans redirection automatique
  }

  chooseRole(role: CaregiverRole): void {
    this.caregiverRoleService.setRole(role);
    
    // Pour les soignants professionnels, naviguer directement vers la sélection des patients
    if (role === 'professional') {
      void this.router.navigateByUrl('/games/patient-selection?from=caregiver-professional');
      return;
    }
    
    void this.router.navigateByUrl(this.caregiverRoleService.getHomePathForRole(role));
  }

  forgetStoredRole(): void {
    this.caregiverRoleService.clearRole();
    this.showForgetChoice = false;
    this.changeDetectorRef.markForCheck();
  }
}
