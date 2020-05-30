import * as puppeteer from 'puppeteer';
import { targetData } from './targetData';
import { AuctionLink, AuctionData } from '../database/models';
import { scrapeTargetData } from '../scrapeTargetData';
import { db } from '../database';

const auctionLinkToAuctionId = (auctionLinkText: string) => {
  const regex = new RegExp(/Case No.? ? »? ?/gi);
  return auctionLinkText.replace(regex, '');
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

  const auctionId = auctionLinkToAuctionId(auctionLink.text);
  console.log({ auctionId });
  db.set(`auctions.${auctionId}`, data).write();
};

export const getAuctionsData = async () => {
  try {
    console.log('Fetching auctions data...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const auctionLinks = db.get('auctionLinks').value();
    const existingData = db.get('auctions').value();

    for (const auctionLink of auctionLinks) {
      const dataExists = existingData[auctionLinkToAuctionId(auctionLink.text)];
      if (!dataExists) {
        await getAuctionData(page, auctionLink);
      } else {
        // console.log(`Already have data for ${auctionLink.href}.`);
      }
    }

    console.log('Fetched auctions data.');
    await browser.close();
  } catch (error) {
    console.log(error);
  }
};
