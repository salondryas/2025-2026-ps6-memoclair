import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

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
  constructor(private readonly location: Location) {}

  goBack(): void {
    this.location.back();
  }
}
