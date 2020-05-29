import * as puppeteer from 'puppeteer';
import { AuctionLink } from '../database/models';
import { db } from '../database';

const getAuctionLinksFromPage = async (
  page: puppeteer.Page,
  startAt: number,
  areFreshResults: boolean,
  existingData: AuctionLink[],
) => {
  let newStartAt = startAt;
  let newAreFreshResults = areFreshResults;
  const url = `https://www.greengazette.co.za/search?q=auction%20"Case%20No"&StartAt=${startAt}&Count=50&Phrase=&Exclude=&Filter=&From=`;
  console.log(`Fetching auction links from ${url}`);
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

  const auctionLink = resultLinks.filter(link =>
    link.text.startsWith('Case No'),
  );
  console.log(`Found ${auctionLink.length} auction links.`);
  const newData = existingData;

  for (const link of auctionLink) {
    const dataExists = existingData.some(
      existingLink => existingLink.href === link.href,
    );

    if (!dataExists) {
      newData.push(link);
    } else {
      console.log(`${link.text} already exists, stopping scrape.`);
      newAreFreshResults = false;
      break;
    }
  }

  // save results after each fetch in case of errors
  db.set('auctionLinks', newData).write();

  if (newAreFreshResults) {
    newStartAt += resultLinks.length;
    await getAuctionLinksFromPage(
      page,
      newStartAt,
      newAreFreshResults,
      newData,
    );
  }
};

export const getAuctionLinks = async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const startAt = 1;
    const areFreshResults = true;
    const existingData = db.get('auctionLinks').value();
    await getAuctionLinksFromPage(page, startAt, areFreshResults, existingData);
    await browser.close();
  } catch (error) {
    console.log(error);
  }
};
