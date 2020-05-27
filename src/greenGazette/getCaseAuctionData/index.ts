import * as puppeteer from 'puppeteer';
// import { CaseAuctionData } from '../database/models';
import { targetData } from './targetData';
import { readDBNode, DBNode } from '../database/readDBNode';
import { CaseLink } from '../database/models';

export const getCaseAuctionData = async () => {
  try {
    const caseLinks: CaseLink[] = readDBNode(DBNode.caseLinks);
    const url = caseLinks[0].href; // TODO: Get all
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    console.log(`Fetching case data from ${url}.`);
    await page.goto(url);

    const data = {};
    for await (const target of targetData) {
      const value = await page.$$eval(
        target.selector,
        elements =>
          elements.map(el => {
            return {
              text: el.textContent,
              href: el.getAttribute('href'),
            };
          })[0],
      );

      if (target.href) {
        data[target.key] = value.href;
      } else {
        data[target.key] = value
          ? value.text.trim().replace(/(\r\n|\n|\r)/gm, '')
          : '';
      }
    }
    console.log({ data });

    // await browser.close();
  } catch (error) {
    console.log(error);
  }
};
