import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PatientContextService } from '../services/patient-context.service';

export const activePatientGuard: CanActivateFn = () => {
  const router = inject(Router);
  const patientContext = inject(PatientContextService);

  const patient = patientContext.getActivePatientSnapshot();
  if (patient?.id) return true;

  return router.parseUrl('/patients/select');
};
