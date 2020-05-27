import * as puppeteer from 'puppeteer';
import { targetData } from './targetData';
import { readDatabase } from '../database/readDatabase';
import {
  CaseLink,
  CasePropertyData,
  DbNode,
  CaseAuctionData,
} from '../database/models';
import { writeDatabase } from '../database/writeDatabase';

const caseLinkTextToCaseNumber = (caseLinkText: string) => {
  return caseLinkText.replace('Case No. ', '');
};

const getCaseAuctionData = async (page: puppeteer.Page, caseLink: CaseLink) => {
  const { href: url } = caseLink;
  console.log(`Fetching case data from ${url}.`);
  await page.goto(url);
  const data = {} as CaseAuctionData;
  try {
    await page.waitForSelector('#main', { timeout: 5000 });

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

    data.href = url;

    /*
     * HACK:
     * Sometimes there isn't sheriff data and the web page's tables are not unique enough
     * to target correctly so we'll manually reassign the data in that case
     */
    const attorneyFieldsAreBlank = !Object.keys(data).some(
      key => key.includes('attorney') && data[key],
    );
    if (attorneyFieldsAreBlank) {
      let nextAttorneyKey = Object.keys(data).filter(key =>
        key.includes('attorney'),
      )[0];
      let count = 0;
      Object.keys(data).forEach(key => {
        const isSheriffField = key.includes('sheriff');
        const isSheriffUnparsedIdField = key.includes('Unparsed');
        if (isSheriffField && !isSheriffUnparsedIdField) {
          const newCount = count + 1;
          nextAttorneyKey = nextAttorneyKey.replace(
            count.toString(),
            newCount.toString(),
          );
          count = newCount;
          data[nextAttorneyKey] = data[key];
          data[key] = '';
        }
      });
    }
  } catch (error) {
    console.log(error);
  }

  // save results after each fetch in case of errors
  const existingData: CasePropertyData[] = readDatabase(DbNode.caseAuctionData);
  const newData = { ...existingData };
  newData[caseLinkTextToCaseNumber(caseLink.text)] = data;
  writeDatabase(DbNode.caseAuctionData, newData);
};

export const getCasesAuctionData = async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const caseLinks: CaseLink[] = readDatabase(DbNode.caseLinks);
    const existingData: CasePropertyData[] = readDatabase(
      DbNode.caseAuctionData,
    );

    for (const caseLink of caseLinks) {
      const dataForCaseLinkExists =
        existingData[caseLinkTextToCaseNumber(caseLink.text)];
      if (!dataForCaseLinkExists) {
        await getCaseAuctionData(page, caseLink);
      } else {
        console.log(`Already have data for ${caseLink.href}.`);
      }
    }

    await browser.close();
  } catch (error) {
    console.log(error);
  }
};
