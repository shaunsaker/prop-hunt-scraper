require('dotenv').config();

// import { getAuctionLinks } from './getAuctionLinks';
// import { getAuctionsData } from './getAuctionsData';
// import { getPropertiesData } from './getPropertiesData';
import { getLocalityDataForProperties } from './getLocalityDataForProperties';

const main = async () => {
  // await getAuctionLinks();
  // await getAuctionsData();
  // await getPropertiesData();
  await getLocalityDataForProperties();
};

main();
