import * as puppeteer from 'puppeteer';
import { readDatabase } from '../database/readDatabase';
import { DbNode, CaseAuctionData, CasePropertyData } from '../database/models';

const getCasePropertyData = (
  page: puppeteer.Page,
  caseAuction: CaseAuctionData,
) => {};

export const getCasesPropertyData = async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const caseAuctions: Record<string, CaseAuctionData> = readDatabase(
      DbNode.caseAuctionData,
    );
    const existingData: Record<string, CasePropertyData> = readDatabase(
      DbNode.caseAuctionData,
    );

    const caseAuctionsArray = Object.keys(caseAuctions).map(
      key => caseAuctions[key],
    );
    for (const caseAuction of caseAuctionsArray) {
      const isEmpty = Object.keys(caseAuction).length === 0;
      if (!isEmpty) {
        const dataExists = existingData[caseAuction.titleDeed];
        if (!dataExists) {
          await getCasePropertyData(page, caseAuction);
        } else {
          console.log(`Already have data for ${caseAuction.href}.`);
        }
      } else {
        console.log(`Data is empty for ${caseAuction.href}.`);
      }
    }

    await browser.close();
  } catch (error) {
    console.log(error);
  }
};
