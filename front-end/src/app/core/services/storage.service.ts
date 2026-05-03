import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  getLocalItem<T>(key: string): T | null {
    return this.readFromStorage<T>(this.getLocalStorage(), key);
  }

  setLocalItem<T>(key: string, value: T): void {
    this.writeToStorage(this.getLocalStorage(), key, value);
  }

  removeLocalItem(key: string): void {
    this.getLocalStorage()?.removeItem(key);
  }

  getSessionItem<T>(key: string): T | null {
    return this.readFromStorage<T>(this.getSessionStorage(), key);
  }

  setSessionItem<T>(key: string, value: T): void {
    this.writeToStorage(this.getSessionStorage(), key, value);
  }

  removeSessionItem(key: string): void {
    this.getSessionStorage()?.removeItem(key);
  }

  private readFromStorage<T>(storage: Storage | null, key: string): T | null {
    if (!storage) {
      return null;
    }

    const rawValue = storage.getItem(key);
    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as T;
    } catch {
      return null;
    }
  }

  private writeToStorage<T>(storage: Storage | null, key: string, value: T): void {
    if (!storage) {
      return;
    }

    storage.setItem(key, JSON.stringify(value));
  }

  private getLocalStorage(): Storage | null {
    return this.hasWindowStorage() ? window.localStorage : null;
  }

  private getSessionStorage(): Storage | null {
    return this.hasWindowStorage() ? window.sessionStorage : null;
  }

  private hasWindowStorage(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }
}
