import * as csvtojson from 'csvtojson/v2';
import * as path from 'path';
import { SuburbCsv, City, Suburb } from '../database/models';
import { db } from '../database';

export const createCitiesSuburbsData = async () => {
  // Resets
  // db.unset('cities').write();
  // db.unset('suburbs').write();

  const jsonArray: SuburbCsv[] = await csvtojson().fromFile(
    path.join(__dirname, '../../../cities-suburbs-south-africa.csv'),
  );
  console.log(`Found ${jsonArray.length} suburbs.`);

  let count = 0;
  for (const item of jsonArray) {
    count += 1;
    console.log(`Processing suburb: ${count} / ${jsonArray.length}`);
    if (item.City && item.Town) {
      const suburbId = item.Town;
      const cityId = item.City === '-' ? suburbId : item.City;
      const city: City = {
        name: cityId,
      };
      const suburb: Suburb = {
        name: suburbId,
        cityId,
        streetCode: item['Street code'],
      };

      const cityExists = Boolean(db.get(`cities.${cityId}`).value());
      if (!cityExists) {
        db.get('cities')
          .set(cityId, city)
          .write();
      }

      const suburbExists = Boolean(db.get(`suburbs.${suburbId}`).value());
      if (!suburbExists) {
        db.get('suburbs')
          .set(suburbId, suburb)
          .write();
      }
    }
  }

  console.log(
    `Added ${db.get('cities').size()} cities and ${db
      .get('suburbs')
      .size()} suburbs.`,
  );
};

createCitiesSuburbsData();
