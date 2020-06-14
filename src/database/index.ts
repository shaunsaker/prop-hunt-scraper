import * as low from 'lowdb';
import * as FileSync from 'lowdb/adapters/FileSync';
import { Database, initialState } from './models';

const adapter = new FileSync('db.json');
const db = low(adapter) as low.LowdbSync<Database>;
db.defaults(initialState).write();

export { db };

export const findExactOrPartialMatchInDb = <T>(
  node: keyof Database,
  value: string,
  searchFields?: (keyof T)[],
): T | null => {
  // Try get an exact match first
  const match = db.get(`${node}.${value}`).value();

  if (match) {
    return match;
  }

  if (searchFields) {
    // Try partial match on searchFields
    const partialMatch = db
      .get(node)
      // @ts-ignore filter does exist
      .filter(item => {
        return searchFields.some(field => {
          if (!item[field]) {
            return false;
          } else if (Array.isArray(item[field])) {
            return item[field].some(item_ => item_ === value);
          } else {
            return item[field] === value;
          }
        });
      })
      .first()
      .value();

    if (partialMatch) {
      return partialMatch;
    }
    return null;
  }

  return null;
};
