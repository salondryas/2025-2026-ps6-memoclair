import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { NavbarComponent } from '../../shared/components/layout/navbar/navbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterModule, NavbarComponent],
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss'],
})
export class AppShellComponent {}
