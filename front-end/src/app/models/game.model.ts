export type GameId = 'game-a' | 'game-b' | 'game-duo';

export interface Game {
  id: GameId;
  title: string;
  description: string;

  // libellés cliniques (issue #4)
  focus: string;
  duration: string;
  memoryAxis: string;
  bullets: string[];

  // routing
  route: string;

  // optionnel
  duo?: boolean;
}
