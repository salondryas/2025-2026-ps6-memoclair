import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PatientId } from '../../../models/patient.model';

export interface CaregiverNote {
  id: string;
  patientId: PatientId;
  caregiverId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface ActivityLogEntry {
  id: string;
  patientId: PatientId;
  caregiverId: string;
  action: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface CaregiverCollaboration {
  patientId: PatientId;
  caregivers: string[];
  notes: CaregiverNote[];
  activityLog: ActivityLogEntry[];
}

@Injectable({ providedIn: 'root' })
export class CollaborationService {
  private collaborations: Map<PatientId, CaregiverCollaboration> = new Map();
  private notes$ = new BehaviorSubject<CaregiverNote[]>([]);
  private activityLog$ = new BehaviorSubject<ActivityLogEntry[]>([]);

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Add a note for a patient
   */
  addNote(patientId: PatientId, caregiverId: string, content: string, tags: string[] = []): CaregiverNote {
    const note: CaregiverNote = {
      id: `note_${Date.now()}`,
      patientId,
      caregiverId,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags,
    };

    const collab = this.getOrCreateCollaboration(patientId);
    collab.notes.push(note);
    this.notes$.next(collab.notes);
    this.saveToStorage();

    return note;
  }

  /**
   * Get all notes for a patient
   */
  getPatientNotes(patientId: PatientId): Observable<CaregiverNote[]> {
    const collab = this.collaborations.get(patientId);
    if (collab) {
      this.notes$.next(collab.notes);
    }
    return this.notes$.asObservable();
  }

  /**
   * Log an activity
   */
  logActivity(patientId: PatientId, caregiverId: string, action: string, description: string, metadata?: Record<string, any>): void {
    const entry: ActivityLogEntry = {
      id: `activity_${Date.now()}`,
      patientId,
      caregiverId,
      action,
      description,
      timestamp: new Date().toISOString(),
      metadata,
    };

    const collab = this.getOrCreateCollaboration(patientId);
    collab.activityLog.push(entry);

    // Keep only last 100 entries
    if (collab.activityLog.length > 100) {
      collab.activityLog = collab.activityLog.slice(-100);
    }

    this.activityLog$.next(collab.activityLog);
    this.saveToStorage();
  }

  /**
   * Get activity log for a patient
   */
  getActivityLog(patientId: PatientId): Observable<ActivityLogEntry[]> {
    const collab = this.collaborations.get(patientId);
    if (collab) {
      this.activityLog$.next(collab.activityLog);
    }
    return this.activityLog$.asObservable();
  }

  /**
   * Add a caregiver to patient's collaboration
   */
  addCaregiver(patientId: PatientId, caregiverId: string): void {
    const collab = this.getOrCreateCollaboration(patientId);
    if (!collab.caregivers.includes(caregiverId)) {
      collab.caregivers.push(caregiverId);
      this.saveToStorage();
    }
  }

  /**
   * Remove a caregiver from patient's collaboration
   */
  removeCaregiver(patientId: PatientId, caregiverId: string): void {
    const collab = this.collaborations.get(patientId);
    if (collab) {
      collab.caregivers = collab.caregivers.filter(id => id !== caregiverId);
      this.saveToStorage();
    }
  }

  /**
   * Get all caregivers for a patient
   */
  getCaregivers(patientId: PatientId): string[] {
    return this.collaborations.get(patientId)?.caregivers || [];
  }

  private getOrCreateCollaboration(patientId: PatientId): CaregiverCollaboration {
    if (!this.collaborations.has(patientId)) {
      this.collaborations.set(patientId, {
        patientId,
        caregivers: [],
        notes: [],
        activityLog: [],
      });
    }
    return this.collaborations.get(patientId)!;
  }

  private saveToStorage(): void {
    try {
      const data = Array.from(this.collaborations.entries());
      localStorage.setItem('mc_collaborations', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save collaborations:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('mc_collaborations');
      if (stored) {
        const data = JSON.parse(stored);
        this.collaborations = new Map(data);
      }
    } catch (error) {
      console.warn('Failed to load collaborations:', error);
    }
  }
}
