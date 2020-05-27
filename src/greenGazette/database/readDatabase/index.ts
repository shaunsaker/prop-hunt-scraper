import * as fs from 'fs';
import * as path from 'path';
import { DbNode } from '../models';

export const readDatabase = (node: DbNode) => {
  const data = JSON.parse(
    fs.readFileSync(path.join(__dirname, `../${node}.json`), {
      encoding: 'utf-8',
    }),
  );

  return data;
};
