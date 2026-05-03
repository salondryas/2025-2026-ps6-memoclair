import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { CreateMediaItemPayload, MediaItem } from '../../../models/media.model';
import { PatientId } from '../../../models/patient.model';

@Injectable({ providedIn: 'root' })
export class MediaLibraryService {
  private readonly base = `${environment.backendUrl}/api/media`;

  constructor(private readonly http: HttpClient) {}

  getMediaItems(patientId: PatientId): Observable<MediaItem[]> {
    return this.http.get<MediaItem[]>(`${this.base}/${patientId}`).pipe(
      catchError(() => of([])),
    );
  }

  uploadMediaItem(patientId: PatientId, file: File, payload: Omit<CreateMediaItemPayload, 'patientId' | 'fileName'>): Observable<MediaItem> {
    const fd = new FormData();
    fd.append('patientId', patientId);
    fd.append('title', payload.title.trim());
    fd.append('kind', payload.kind);
    fd.append('cueType', payload.cueType);
    fd.append('clinicalNote', payload.clinicalNote.trim());
    fd.append('file', file); // doit être en dernier pour que req.body soit dispo dans multer
    return this.http.post<MediaItem>(`${this.base}/upload`, fd);
  }

  deleteMediaItem(patientId: PatientId, itemId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${patientId}/${itemId}`);
  }
}
