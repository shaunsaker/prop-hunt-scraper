import * as puppeteer from 'puppeteer';
import { targetData } from './targetData';
import { readDatabase } from '../database/readDatabase';
import { AuctionLink, DbNode, AuctionData } from '../database/models';
import { writeDatabase } from '../database/writeDatabase';
import { scrapeTargetData } from '../scrapeTargetData';

const auctionLinkToAuctionId = (auctionLinkText: string) => {
  return auctionLinkText.replace('Case No. ', '');
};

const getAuctionData = async (
  page: puppeteer.Page,
  auctionLink: AuctionLink,
) => {
  let data = {} as AuctionData;
  try {
    const scrapedData = await scrapeTargetData<AuctionData>(
      page,
      auctionLink.href,
      targetData,
    );

    /*
     * HACK:
     * Sometimes there isn't sheriff data and the web page's tables are not unique enough
     * to target correctly so we'll manually reassign the data in that case
     */
    const attorneyFieldsAreBlank = !Object.keys(scrapedData).some(
      key => key.includes('attorney') && scrapedData[key],
    );
    if (attorneyFieldsAreBlank) {
      let nextAttorneyKey = Object.keys(scrapedData).filter(key =>
        key.includes('attorney'),
      )[0];
      let count = 0;
      Object.keys(scrapedData).forEach(key => {
        const isSheriffField = key.includes('sheriff');
        const isSheriffUnparsedIdField = key.includes('Unparsed');
        if (isSheriffField && !isSheriffUnparsedIdField) {
          const newCount = count + 1;
          nextAttorneyKey = nextAttorneyKey.replace(
            count.toString(),
            newCount.toString(),
          );
          count = newCount;
          scrapedData[nextAttorneyKey] = scrapedData[key];
          scrapedData[key] = '';
        }
      });
    }

    data = scrapedData;
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
