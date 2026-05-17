import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { BrandLogoComponent } from '../../brand-logo/brand-logo.component';
import { PatientSelectorComponent } from '../../caregiver/patient-selector/patient-selector.component';

@Component({
  selector: 'mc-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, BrandLogoComponent, PatientSelectorComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  constructor(
    private readonly location: Location,
    private readonly router: Router,
  ) {}

  goBack(): void {
    const currentUrl = this.router.url;
    
    if (currentUrl.includes('/caregiver/profile')) {
      void this.router.navigateByUrl('/games/patient-selection-patient?from=caregiver-professional');
    } else if (currentUrl.includes('/caregiver/media')) {
      void this.router.navigateByUrl('/caregiver/profile');
    } else if (currentUrl.includes('/caregiver/statistics')) {
      void this.router.navigateByUrl('/caregiver/profile');
    } else if (currentUrl.includes('/caregiver/profile-management')) {
      void this.router.navigateByUrl('/caregiver/profile');
    } else {
      void this.router.navigateByUrl('/');
    }
  }
}
