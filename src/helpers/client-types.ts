import type { UsersResponse } from './pocketbase-types';

export enum ClientRelations {
  'follow' = 'follow',
  'following' = 'following',
  'pending' = 'pending',
}

export type Vote = {
  id: string;
  uid: string;
  category: string;
  username: string;
  score: number;
};

export type UserRelation = {
  user: UsersResponse;
  state: ClientRelations;
};
