import * as fs from 'fs';
import * as path from 'path';
import { DbNode } from '../models';

export const writeDatabase = <T>(node: DbNode, data: T) => {
  fs.writeFileSync(
    path.join(__dirname, `../${node}.json`),
    JSON.stringify(data),
  );
};
