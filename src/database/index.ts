import * as low from 'lowdb';
import * as FileSync from 'lowdb/adapters/FileSync';
import { Database, initialState } from './models';

const adapter = new FileSync('db.json');
const db = low(adapter) as low.LowdbSync<Database>;
db.defaults(initialState).write();

export { db };

export const findExactOrPartialMatchInDb = (
  node: keyof Database,
  value: string,
) => {
  // Try an exact match first
  const match = db.get(`${node}.${value}`).value();

  if (match) {
    return match;
  }

  // Try partial match
  const partialMatch = db
    .get(node)
    // @ts-ignore filter does exist
    .filter(
      item =>
        value.includes(item.name) ||
        value
          .split(' ')
          .join('')
          .includes(item.name),
    )
    .first()
    .value();

  return partialMatch;
};
