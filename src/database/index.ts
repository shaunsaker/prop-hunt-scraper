import * as low from 'lowdb';
import * as FileSync from 'lowdb/adapters/FileSync';
import { Database, initialState } from './models';

const adapter = new FileSync('db.json');
const db = low(adapter) as low.LowdbSync<Database>;
db.defaults(initialState).write();

export { db };
