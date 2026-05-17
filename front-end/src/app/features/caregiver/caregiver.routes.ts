import { Routes } from '@angular/router';

import { FamilyDashboardPageComponent } from './family-dashboard/family-dashboard-page.component';
import { FamilySouvenirsPageComponent } from './family-souvenirs/family-souvenirs-page.component';
import { CaregiverMediaPageComponent } from './media/caregiver-media-page.component';
import { CaregiverProfilePageComponent } from './profile/caregiver-profile-page.component';
import { ProfileManagementPageComponent } from './profile-management/profile-management-page.component';
import { CaregiverRoleSelectionPageComponent } from './role-selection/caregiver-role-selection-page.component';
import { CaregiverStatisticsPageComponent } from './statistics/caregiver-statistics-page.component';

export const CAREGIVER_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'role-selection',
    pathMatch: 'full',
  },
  {
    path: 'role-selection',
    component: CaregiverRoleSelectionPageComponent,
    title: 'MemoClair — Mode d’accompagnement',
  },
  {
    path: 'profile',
    component: CaregiverProfilePageComponent,
    title: 'MemoClair - Profil accueilli aidant',
  },
  {
    path: 'profile-management',
    component: ProfileManagementPageComponent,
    title: 'MemoClair - Gestion accueillis et aidants',
    data: { mode: 'managed' },
  },
  {
    path: 'professional-profile-management',
    component: ProfileManagementPageComponent,
    title: 'MemoClair - Gestion profils soignants',
    data: { mode: 'professionals' },
  },
  {
    path: 'media',
    component: CaregiverMediaPageComponent,
    title: 'MemoClair - Médiathèque souvenir',
  },
  {
    path: 'family-dashboard',
    component: FamilyDashboardPageComponent,
    title: 'MemoClair - Dashboard familial',
  },
  {
    path: 'family-souvenirs',
    component: FamilySouvenirsPageComponent,
    title: 'MemoClair - Souvenirs',
  },
  {
    path: 'statistics',
    component: CaregiverStatisticsPageComponent,
    title: 'MemoClair - Statistiques aidant',
  },
];
