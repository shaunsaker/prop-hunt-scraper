import * as puppeteer from 'puppeteer';
import { AuctionData, PropertyData } from '../database/models';
import { targetData } from './targetData';
import { scrapeTargetData } from '../scrapeTargetData';
import { db } from '../database';

export const getPropertyId = (
  auction?: AuctionData,
  property?: PropertyData,
) => {
  const getIdFromLink = link => {
    return link.split('/').reverse()[0];
  };

  const propertyId =
    auction?.titleDeed ||
    property?.titleDeed ||
    (auction && getIdFromLink(auction.propertyHref)) ||
    (property && getIdFromLink(property.href));

  if (!propertyId) {
    throw new Error('No property id.');
  }

  return propertyId;
};

const getPropertyData = async (page: puppeteer.Page, auction: AuctionData) => {
  let data = {} as PropertyData;
  try {
    data = await scrapeTargetData(page, auction.propertyHref, targetData);
  } catch (error) {
    console.log(error);
  }

  const propertyId = getPropertyId(auction, data);
  db.set(`properties.${propertyId}`, data).write();
};

export const getPropertiesData = async () => {
  try {
    console.log('Fetching properties data...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const auctionsData = db.get('auctions').value();
    const auctionsArray = Object.keys(auctionsData).map(
      key => auctionsData[key],
    );

    for (const auction of auctionsArray) {
      const isEmpty = Object.keys(auction).length === 0;
      if (!isEmpty) {
        const dataExists = db
          .get('properties')
          .some(property => property.href === auction.propertyHref);
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
