import { Component } from '@angular/core';

import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'mc-caregiver-shell',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './caregiver-shell.component.html',
  styleUrls: ['./caregiver-shell.component.scss'],
})
export class CaregiverShellComponent {}
