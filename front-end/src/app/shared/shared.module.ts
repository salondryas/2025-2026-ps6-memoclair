import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { NavbarComponent } from './components/layout/navbar/navbar.component';
import { CaregiverShellComponent } from './components/layout/caregiver-shell/caregiver-shell.component';
import { PatientSelectorComponent } from './components/caregiver/patient-selector/patient-selector.component';
import { BrandLogoComponent } from './components/brand-logo/brand-logo.component';

@NgModule({
  declarations: [
    NavbarComponent,
    CaregiverShellComponent,
    PatientSelectorComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    BrandLogoComponent,
  ],
  exports: [
    NavbarComponent,
    CaregiverShellComponent,
    PatientSelectorComponent,
  ],
})
export class SharedModule {}
