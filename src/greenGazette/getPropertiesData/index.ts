import * as puppeteer from 'puppeteer';
import { readDatabase } from '../database/readDatabase';
import { DbNode, AuctionData, PropertyData } from '../database/models';
import { writeDatabase } from '../database/writeDatabase';
import { targetData } from './targetData';
import { scrapeTargetData } from '../scrapeTargetData';

const getPropertyData = async (page: puppeteer.Page, auction: AuctionData) => {
  let data = {} as PropertyData;
  try {
    data = await scrapeTargetData(page, auction.propertyHref, targetData);
  } catch (error) {
    console.log(error);
  }

  // save results after each fetch in case of errors
  const existingData: AuctionData[] = readDatabase(DbNode.propertyData);
  const newData = { ...existingData };
  newData[auction.titleDeed] = data;
  writeDatabase(DbNode.propertyData, newData);
};

export const getPropertiesData = async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const auctionData: Record<string, AuctionData> = readDatabase(
      DbNode.auctionData,
    );
    const existingData: Record<string, PropertyData> = readDatabase(
      DbNode.propertyData,
    );

    const auctionsArray = Object.keys(auctionData).map(key => auctionData[key]);
    for (const auction of auctionsArray) {
      const isEmpty = Object.keys(auction).length === 0;
      if (!isEmpty) {
        const dataExists = existingData[auction.titleDeed];
        if (!dataExists) {
          await getPropertyData(page, auction);
        } else {
          console.log(`Already have data for ${auction.href}.`);
        }
      } else {
        console.log(`Data is empty for ${auction.href}.`);
      }
    }

    await browser.close();
  } catch (error) {
    console.log(error);
  }
};
