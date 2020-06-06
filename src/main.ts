require('dotenv').config();

// import { getAuctionLinks } from './getAuctionLinks';
// import { getAuctionsData } from './getAuctionsData';
// import { getPropertiesData } from './getPropertiesData';
import { attachCitySuburbIdsToProperties } from './attachCitySuburbIdsToProperties';

const main = async () => {
  // await getAuctionLinks();
  // await getAuctionsData();
  // await getPropertiesData();
  await attachCitySuburbIdsToProperties();
};

main();
