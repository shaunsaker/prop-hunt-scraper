import * as fs from 'fs';
import * as path from 'path';

export enum DBNode {
  caseAuctionData = 'caseAuctionData',
  caseLinks = 'caseLinks',
}

export const readDBNode = (dbNode: DBNode) => {
  const data = JSON.parse(
    fs.readFileSync(path.join(__dirname, `../${dbNode}.json`), {
      encoding: 'utf-8',
    }),
  );

  return data;
};
