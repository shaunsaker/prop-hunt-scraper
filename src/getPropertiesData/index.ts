import * as puppeteer from 'puppeteer';
import { AuctionData, PropertyData } from '../database/models';
import { targetData } from './targetData';
import { scrapeTargetData } from '../scrapeTargetData';
import { db } from '../database';

const getPropertyIdFromLink = (link: string) => {
  return link.split('/').reverse()[0];
};

const getPropertyData = async (page: puppeteer.Page, auction: AuctionData) => {
  let data = {} as PropertyData;
  try {
    data = await scrapeTargetData(page, auction.propertyHref, targetData);
  } catch (error) {
    console.log(error);
  }

  // Try to use the titleDeed if it exists, otherwise use the propertyHref id
  const propertyId =
    auction.titleDeed ||
    data.titleDeed ||
    getPropertyIdFromLink(auction.propertyHref);

  db.set(`properties.${propertyId}`, {
    ...data,
    propertyId,
  }).write();
};

export const getPropertiesData = async () => {
  try {
    console.log('Fetching properties data...');
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
          // console.log(`Already have data for ${auction.href}.`);
        }
      }
    }
    console.log('Fetched properties data.');

    await browser.close();
  } catch (error) {
    console.log(error);
  }
};
