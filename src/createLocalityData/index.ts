import * as csvtojson from 'csvtojson/v2';
import * as path from 'path';
import * as promptly from 'promptly';
import { City, Suburb, Province, CityId } from '../database/models';
import { db } from '../database';

interface ProvinceCityCsv {
  AccentCity: string;
  ProvinceName: string;
}

interface SuburbCsv {
  Town: string;
  City: string;
}

export const getCityFromUserInput = async (cityId: CityId): Promise<CityId> => {
  const answer = await promptly.prompt(
    `${cityId} does not exist. Is this a modern name for a city (y/n)?`,
  );

  if (answer.toUpperCase() === 'Y') {
    const existingCityId = await promptly.prompt(
      'What is the original cities name?',
    );
    db.update(`cities.${existingCityId}`, existingData => {
      return {
        ...existingData,
        modernName: cityId,
      };
    }).write();

    return existingCityId;
  } else {
    const newCityId = await promptly.prompt(
      `${cityId} does not exist. What city should we add?`,
    );

    if (answer) {
      const provinceId = await promptly.prompt(
        'What is the province id for this new city?',
      );
      const city: City = {
        name: newCityId,
        provinceId,
      };
      db.get('cities')
        .set(newCityId, city)
        .write();
    }

    return newCityId;
  }
};

export const createLocalityData = async () => {
  // Resets
  // db.unset('provinces').write();
  // db.unset('cities').write();
  // db.unset('suburbs').write();

  const provinceCitiesArray: ProvinceCityCsv[] = await csvtojson().fromFile(
    path.join(__dirname, '../../../provinces-cities-south-africa.csv'),
  );
  const totalCities = provinceCitiesArray.length;
  console.log(`Found ${totalCities} cities.`);
  let citiesCount = 0;
  for (const item of provinceCitiesArray) {
    citiesCount += 1;
    console.log(`Processing city: ${citiesCount} / ${totalCities}`);
    const provinceId = item.ProvinceName.toUpperCase();
    const provinceExists = Boolean(db.get(`provinces.${provinceId}`).value());
    if (!provinceExists) {
      const province: Province = {
        name: provinceId,
      };
      db.get('provinces')
        .set(provinceId, province)
        .write();
    }

    const cityId = item.AccentCity.toUpperCase();
    const cityExists = Boolean(db.get(`cities.${cityId}`).value());
    if (!cityExists) {
      const city: City = {
        name: cityId,
        provinceId,
      };
      db.get('cities')
        .set(cityId, city)
        .write();
    }
  }

  const suburbsArray: SuburbCsv[] = await csvtojson().fromFile(
    path.join(__dirname, '../../../suburbs-south-africa.csv'),
  );
  const totalSuburbs = suburbsArray.length;
  console.log(`Found ${totalSuburbs} suburbs.`);
  let suburbsCount = 0;
  for (const item of suburbsArray) {
    suburbsCount += 1;
    console.log(`Processing suburb: ${suburbsCount} / ${totalSuburbs}`);
    if (item.City && item.Town) {
      const suburbId = item.Town;
      const cityId = item.City === '-' ? suburbId : item.City;

      if (item.City !== '-') {
        const suburbExists = Boolean(db.get(`suburbs.${suburbId}`).value());
        const cityExists = Boolean(db.get(`cities.${cityId}`).value());
        if (cityExists && !suburbExists) {
          const suburb: Suburb = {
            name: suburbId,
            cityId,
          };
          db.get('suburbs')
            .set(suburbId, suburb)
            .write();
        } else if (!cityExists) {
          // This means that the city is actually a suburb we will create a suburb eventually
          const suburbExistsWithSameId = suburbsArray.filter(
            item => item.Town === cityId,
          );
          if (!suburbExistsWithSameId) {
            const cityWithModernNameExists = db
              .get('cities')
              .filter(city => city.modernName === cityId)
              .first()
              .value();

            if (cityWithModernNameExists) {
              const actualCityId = cityWithModernNameExists.name;
              const suburb: Suburb = {
                name: suburbId,
                cityId: actualCityId,
              };
              db.get('suburbs')
                .set(suburbId, suburb)
                .write();
            } else {
              await getCityFromUserInput(cityId);
            }
          }
        }
      }
    }
  }
  console.log(
    `Added ${db.get('provinces').size()} provinces and ${db
      .get('cities')
      .size()} cities and ${db.get('suburbs').size()} suburbs.`,
  );
};
