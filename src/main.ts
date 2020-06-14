require('dotenv').config();

// import { getAuctionLinks } from './getAuctionLinks';
// import { getAuctionsData } from './getAuctionsData';
// import { getPropertiesData } from './getPropertiesData';
// import { getLocalityDataForProperties } from './getLocalityDataForProperties';
import { createLocalityData } from './createLocalityData';

const main = async () => {
  // await getAuctionLinks();
  // await getAuctionsData();
  // await getPropertiesData();
  await createLocalityData();
};

main();
