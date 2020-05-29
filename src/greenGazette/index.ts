import { getAuctionLinks } from './getAuctionLinks';
import { getAuctionsData } from './getAuctionsData';
// import { getPropertiesData } from './getPropertiesData';

export const greenGazette = async () => {
  await getAuctionLinks();
  await getAuctionsData();
  // await getPropertiesData();
};
