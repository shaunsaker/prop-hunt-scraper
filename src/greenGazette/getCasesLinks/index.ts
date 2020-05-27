import * as puppeteer from 'puppeteer';
import { CaseLink, DbNode } from '../database/models';
import { readDatabase } from '../database/readDatabase';
import { writeDatabase } from '../database/writeDatabase';

const getCaseLinks = async (
  page: puppeteer.Page,
  startAt: number,
  areFreshResults: boolean,
  existingData: CaseLink[],
) => {
  let newStartAt = startAt;
  let newAreFreshResults = areFreshResults;
  const url = `https://www.greengazette.co.za/search?q=auction%20"Case%20No"&StartAt=${startAt}&Count=50&Phrase=&Exclude=&Filter=&From=`;
  console.log(`Fetching case links from ${url}.`);
  await page.goto(url);
  await page.waitForSelector('#main');

  const resultsSelector = '#main table[width="660"]';
  const resultLinks = await page.$$eval(`${resultsSelector} a`, anchors =>
    anchors.map(anchor => {
      return {
        href: anchor.getAttribute('href'),
        text: anchor.textContent.trim(),
        dateCreated: Date.now(),
      };
    }),
  );

  if (!resultLinks.length) {
    newAreFreshResults = false;
  }

  const caseLinks = resultLinks.filter(link => link.text.startsWith('Case No'));
  console.log(`Found ${caseLinks.length} case links.`);
  const newData = existingData;

  for (const link of caseLinks) {
    const caseExists = existingData.some(
      existingLink => existingLink.href === link.href,
    );

    if (!caseExists) {
      newData.push(link);
    } else {
      console.log(`${link.text} already exists, stopping scrape.`);
      newAreFreshResults = false;
      break;
    }
  }

  // save results after each fetch in case of errors
  writeDatabase(DbNode.caseLinks, newData);

  if (newAreFreshResults) {
    newStartAt += resultLinks.length;
    await getCaseLinks(page, newStartAt, newAreFreshResults, newData);
  }
};

export const getCasesLinks = async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const startAt = 1;
    const areFreshResults = true;
    const existingData: CaseLink[] = readDatabase(DbNode.caseLinks);
    await getCaseLinks(page, startAt, areFreshResults, existingData);
    await browser.close();
  } catch (error) {
    console.log(error);
  }
};
