/**
 * This file was @generated using pocketbase-typegen
 */

export enum Collections {
  Countries = 'countries',
  Relations = 'relations',
  Users = 'users',
  Votes = 'votes',
}

// Alias types for improved usability
export type IsoDateString = string;
export type RecordIdString = string;
export type HTMLString = string;

// System fields
export type BaseSystemFields<T = never> = {
  id: RecordIdString;
  created: IsoDateString;
  updated: IsoDateString;
  collectionId: string;
  collectionName: Collections;
  expand?: T;
};

export type AuthSystemFields<T = never> = {
  email: string;
  emailVisibility: boolean;
  username: string;
  verified: boolean;
} & BaseSystemFields<T>;

// Record types for each collection

export type CountriesRecord = {
  country: string;
  song: string;
  band: string;
  flag?: string;
  profile?: string;
};

export enum RelationsStateOptions {
  'follow' = 'follow',
  'accept' = 'accept',
  'deny' = 'deny',
  'unfollow' = 'unfollow',
}
export type RelationsRecord = {
  from: RecordIdString;
  to: RecordIdString;
  state: RelationsStateOptions;
};

export type UsersRecord = {
  followers?: RecordIdString[];
  following?: RecordIdString[];
};

export enum VotesCategoryOptions {
  'singing' = 'singing',
  'song' = 'song',
  'performance' = 'performance',
  'outfit' = 'outfit',
  'vibes' = 'vibes',
  'overall' = 'overall',
}
export type VotesRecord = {
  category: VotesCategoryOptions;
  score: number;
  user: RecordIdString;
  country: RecordIdString;
};

// Response types include system fields and match responses from the PocketBase API
export type CountriesResponse = CountriesRecord & BaseSystemFields;
export type RelationsResponse<Texpand = unknown> = RelationsRecord &
  BaseSystemFields<Texpand>;
export type UsersResponse<Texpand = unknown> = UsersRecord &
  AuthSystemFields<Texpand>;
export type VotesResponse<Texpand = unknown> = VotesRecord &
  BaseSystemFields<Texpand>;

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
  countries: CountriesRecord;
  relations: RelationsRecord;
  users: UsersRecord;
  votes: VotesRecord;
};

export type CollectionResponses = {
  countries: CountriesResponse;
  relations: RelationsResponse;
  users: UsersResponse;
  votes: VotesResponse;
};
