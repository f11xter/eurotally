export interface Vote {
  readonly id: string;
  readonly uid: string;
  readonly category: string;
  readonly username: string;
  score: number;
}