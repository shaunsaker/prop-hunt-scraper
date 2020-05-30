import * as csvtojson from 'csvtojson/v2';
import * as path from 'path';
import { SuburbCsv, City, Suburb } from '../database/models';
import { db } from '../database';

export const createCitiesSuburbsData = async () => {
  const jsonArray: SuburbCsv[] = await csvtojson().fromFile(
    path.join(__dirname, '../../../cities-suburbs-south-africa.csv'),
  );
  console.log(`Found ${jsonArray.length} suburbs.`);

  for (const item of jsonArray) {
    if (item.City && item.Town) {
      const cityId = item.City;
      const city: City = {
        name: cityId,
      };
      const suburbId = item.Town;
      const suburb: Suburb = {
        name: suburbId,
        cityId,
        streetCode: item['Street code'],
      };

      db.get('cities')
        .set(cityId, city)
        .write();
      db.get('suburbs')
        .set(suburbId, suburb)
        .write();
    }
  }

  console.log(
    `Added ${db.get('cities').size()} cities and ${db
      .get('suburbs')
      .size()} suburbs.`,
  );
};

createCitiesSuburbsData();
