import * as puppeteer from 'puppeteer';
import { AuctionData, PropertyData } from '../database/models';
import { targetData } from './targetData';
import { scrapeTargetData } from '../scrapeTargetData';
import { db } from '../database';

const getPropertyData = async (page: puppeteer.Page, auction: AuctionData) => {
  let data = {} as PropertyData;
  try {
    data = await scrapeTargetData(page, auction.propertyHref, targetData);
  } catch (error) {
    console.log(error);
  }

  db.set(`properties.${auction.titleDeed}`, data).write();
};

export const getPropertiesData = async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const auctionsData = db.get('auctions').value();
    const existingData = db.get('properties').value();
    const auctionsArray = Object.keys(auctionsData).map(
      key => auctionsData[key],
    );

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
