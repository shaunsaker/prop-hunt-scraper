import * as csvtojson from 'csvtojson/v2';
import * as path from 'path';
import * as shortid from 'shortid';
import { City, Suburb, Province, Database, Locality } from '../database/models';
import { db, findExactOrPartialMatchInDb } from '../database';
import {
  googlePlacesApiEndpoint,
  GooglePlacesApiData,
  GoogleMapsApiLocalityType,
  GooglePlacesCandidate,
  googlePlacesApiLimit,
} from '../api/googleMaps';
import { fetchData } from '../utils';

interface ProvinceCityCsv {
  AccentCity: string;
  ProvinceName: string;
}

interface SuburbCsv {
  Town: string;
  City: string;
}

const getVerifiedLocality = async (
  localityName: string,
  localityType: GoogleMapsApiLocalityType,
): Promise<GooglePlacesCandidate | null> => {
  // Update googlePlacesApiCalls so we don't hit the limit
  const googlePlacesApiCalls = db.get('googlePlacesApiCalls').value();
  const newGooglePlacesApiCalls = googlePlacesApiCalls + 1;

  if (newGooglePlacesApiCalls < googlePlacesApiLimit) {
    db.set('googlePlacesApiCalls', newGooglePlacesApiCalls).write();

    // Use the Google Places API to confirm that the expected type matches
    const placesUrl = encodeURI(
      `${googlePlacesApiEndpoint}${localityName} South Africa`,
    );
    const placesData = await fetchData<GooglePlacesApiData>(placesUrl);

    if (placesData.candidates.length) {
      if (placesData.candidates[0].types.includes(localityType)) {
        return placesData.candidates[0];
      }
    }

    return null;
  } else {
    throw new Error('Reached Google Places API limit.');
  }
};

const addAlternativeNameToLocality = (
  alternativeName: string,
  dbNode: keyof Database,
  existingLocalityId: string,
) => {
  db.update(`${dbNode}.${existingLocalityId}`, (existingData: City) => {
    const alternateNames = [...existingData.alternateNames, alternativeName];
    return {
      ...existingData,
      alternateNames,
    };
  }).write();
  console.log(
    `Adding new alternative name: ${alternativeName} to ${dbNode}.${existingLocalityId}.`,
  );
};

const createLocalityDataByLocalityType = async <T extends Locality>(
  localityType: GoogleMapsApiLocalityType,
  localityName: string,
  dbNode: keyof Database,
  notDbNode: keyof Database,
  additionalData: Record<string, any> = {},
) => {
  let localityExists: T = findExactOrPartialMatchInDb(dbNode, localityName, [
    'name',
    'alternateNames',
  ]);

  if (!localityExists) {
    const isNotLocalityType = findExactOrPartialMatchInDb(
      notDbNode,
      localityName,
      ['name'],
    );

    if (!isNotLocalityType) {
      const verifiedLocality = await getVerifiedLocality(
        localityName,
        localityType,
      );

      if (verifiedLocality) {
        const verifiedLocalityName = verifiedLocality.name.toUpperCase();
        localityExists = findExactOrPartialMatchInDb(
          dbNode,
          verifiedLocalityName,
          ['name', 'alternateNames'],
        );
        if (localityExists) {
          addAlternativeNameToLocality(localityName, dbNode, localityExists.id);
        } else {
          const alternateNames = [];
          if (localityName !== verifiedLocalityName) {
            alternateNames.push(localityName);
          }
          const localityId = shortid();
          const locality = {
            id: localityId,
            name: verifiedLocalityName,
            alternateNames,
            coords: {
              ...verifiedLocality.geometry.location,
            },
            googlePlaceId: verifiedLocality.place_id,
            ...additionalData,
          } as T;
          db.get(dbNode)
            .set(localityId, locality)
            .write();
          console.log(
            `Adding ${
              locality.name
            } with alternate name(s): ${locality.alternateNames.join(',')}.`,
          );
        }
      } else {
        console.log(`${localityName} is not a Google Places ${localityType}.`);
        const localityId = shortid();
        const locality = {
          id: localityId,
          name: localityName,
        } as T;
        const localityDoesNotExist = findExactOrPartialMatchInDb(
          notDbNode,
          localityName,
        );
        if (!localityDoesNotExist) {
          db.get(notDbNode)
            .set(localityId, locality)
            .write();
          console.log(`Adding ${locality.name} to ${notDbNode}.`);
        }
      }
    }
  } else {
    // console.log(`${localityName} already exists.`);
    const existingLocalityId = localityExists.name;
    if (existingLocalityId !== localityName) {
      const existingLocalityHasAlternateNames = localityExists.alternateNames?.some(
        item => item === localityName,
      );
      if (!existingLocalityHasAlternateNames) {
        addAlternativeNameToLocality(localityName, dbNode, existingLocalityId);
      }
    }
  }
};

const createProvinces = async () => {
  const provinceCitiesArray: ProvinceCityCsv[] = await csvtojson().fromFile(
    path.join(__dirname, '../../../provinces-cities-south-africa.csv'),
  );

  for (const item of provinceCitiesArray) {
    const provinceName = item.ProvinceName.toUpperCase();
    await createLocalityDataByLocalityType<Province>(
      GoogleMapsApiLocalityType.province,
      provinceName,
      'provinces',
      'notProvinces',
    );
  }
};

const createCities = async () => {
  const provinceCitiesArray: ProvinceCityCsv[] = await csvtojson().fromFile(
    path.join(__dirname, '../../../provinces-cities-south-africa.csv'),
  );

  for (const item of provinceCitiesArray) {
    const cityName = item.AccentCity.toUpperCase();
    const provinceName = item.ProvinceName.toUpperCase();
    const province = findExactOrPartialMatchInDb<City>(
      'provinces',
      provinceName,
      ['name', 'alternateNames'],
    );

    if (!province) {
      throw new Error(`No city found for ${provinceName}.`);
    }

    await createLocalityDataByLocalityType<Province>(
      GoogleMapsApiLocalityType.city,
      cityName,
      'cities',
      'notCities',
      { provinceId: province.id },
    );
  }
};

const createSuburbs = async () => {
  const suburbsArray: SuburbCsv[] = await csvtojson().fromFile(
    path.join(__dirname, '../../../suburbs-south-africa.csv'),
  );

  for (const item of suburbsArray) {
    const suburbName = item.Town.toUpperCase();
    const cityName = item.City.toUpperCase();
    const city = findExactOrPartialMatchInDb<City>('cities', cityName, [
      'name',
      'alternateNames',
    ]);

    if (!city) {
      throw new Error(`No city found for ${suburbName}.`);
    }

    await createLocalityDataByLocalityType<Suburb>(
      GoogleMapsApiLocalityType.city,
      suburbName,
      'suburbs',
      'notSuburbs',
      { cityId: city.id },
    );
  }

  // TODO: Should we take notCities?
};

export const createLocalityData = async () => {
  // Resets
  // db.unset('provinces').write();
  // db.unset('notProvinces').write();
  // db.unset('cities').write();
  // db.unset('notCities').write();
  // db.unset('suburbs').write();
  // db.unset('notSuburbs').write();

  // await createProvinces();
  await createCities();
  // await createSuburbs(); // TODO:

  console.log(
    `We have ${db.get('provinces').size()} provinces, ${db
      .get('cities')
      .size()} cities and ${db
      .get('suburbs')
      .size()} suburbs. Total Google Places API calls: ${db
      .get('googlePlacesApiCalls')
      .value()}`,
  );
};
