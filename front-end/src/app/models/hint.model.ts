import { MemoryCueType } from './media.model';

/** Indice contextuel pour l'aidant — jamais un signal d'échec pour le patient. */
export interface Hint {
  id: string;
  cueType: MemoryCueType;
  /** Formulation douce, sans impératif brusque. */
  text: string;
}
