import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

const caseLinksPath = path.join(
  __dirname,
  '../../../../database/caseLinks.json',
);

const getCaseLinksFromPage = async (
  page,
  startAt,
  areFreshResults,
  existingCaseLinks,
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
  const newCaseLinks = existingCaseLinks;

  for (const link of caseLinks) {
    const caseExists = existingCaseLinks.some(
      existingLink => existingLink.href === link.href,
    );

    if (!caseExists) {
      newCaseLinks.push(link);
    } else {
      console.log(`${link.text} already exists, stopping scrape.`);
      newAreFreshResults = false;
      break;
    }
  }

  // save results after each fetch in case of errors
  fs.writeFileSync(caseLinksPath, JSON.stringify(newCaseLinks));

  if (newAreFreshResults) {
    newStartAt += resultLinks.length;
    await getCaseLinksFromPage(
      page,
      newStartAt,
      newAreFreshResults,
      newCaseLinks,
    );
  }
};

export const getCaseLinks = async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const startAt = 1;
    const areFreshResults = true;
    const existingCaseLinks = JSON.parse(
      fs.readFileSync(caseLinksPath, {
        encoding: 'utf-8',
      }),
    );
    await getCaseLinksFromPage(
      page,
      startAt,
      areFreshResults,
      existingCaseLinks,
    );
    await browser.close();
  } catch (error) {
    console.log(error);
  }
};
