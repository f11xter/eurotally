import { ClientRelations } from './client-types';
import { RelationsStateOptions } from './pocketbase-types';

/**
 * Returns client representation of follow state
 * @param state server representation of follow state
 */
export function getStateString(state: RelationsStateOptions | undefined) {
  switch (state) {
    case RelationsStateOptions.follow:
      return ClientRelations.pending;

    case RelationsStateOptions.accept:
      return ClientRelations.following;

    default:
      return ClientRelations.follow;
  }
}
