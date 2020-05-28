import * as puppeteer from 'puppeteer';
import { readDatabase } from '../database/readDatabase';
import { DbNode, AuctionData, PropertyData } from '../database/models';

const getPropertyData = (page: puppeteer.Page, auction: AuctionData) => {};

export const getPropertiesData = async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const auctionData: Record<string, AuctionData> = readDatabase(
      DbNode.auctionData,
    );
    const existingData: Record<string, PropertyData> = readDatabase(
      DbNode.auctionData,
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
