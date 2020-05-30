require('dotenv').config();

import { getAuctionLinks } from './getAuctionLinks';
import { getAuctionsData } from './getAuctionsData';
import { getPropertiesData } from './getPropertiesData';

const main = async () => {
  await getAuctionLinks();
  await getAuctionsData();
  await getPropertiesData();
};

main();
