import * as puppeteer from 'puppeteer';
import { targetData } from './targetData';
import { readDatabase } from '../database/readDatabase';
import { AuctionLink, DbNode, AuctionData } from '../database/models';
import { writeDatabase } from '../database/writeDatabase';

const auctionLinkToAuctionId = (auctionLinkText: string) => {
  return auctionLinkText.replace('Case No. ', '');
};

const getAuctionData = async (
  page: puppeteer.Page,
  auctionLink: AuctionLink,
) => {
  const { href: url } = auctionLink;
  console.log(`Fetching auction data from ${url}.`);
  await page.goto(url);
  const data = {} as AuctionData;
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
  const existingData: AuctionData[] = readDatabase(DbNode.auctionData);
  const newData = { ...existingData };
  newData[auctionLinkToAuctionId(auctionLink.text)] = data;
  writeDatabase(DbNode.auctionData, newData);
};

export const getAuctionsData = async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const auctionLinks: AuctionLink[] = readDatabase(DbNode.auctionLink);
    const existingData: AuctionData[] = readDatabase(DbNode.auctionData);

    for (const auctionLink of auctionLinks) {
      const dataExists = existingData[auctionLinkToAuctionId(auctionLink.text)];
      if (!dataExists) {
        await getAuctionData(page, auctionLink);
      } else {
        console.log(`Already have data for ${auctionLink.href}.`);
      }
    }

    await browser.close();
  } catch (error) {
    console.log(error);
  }
};
