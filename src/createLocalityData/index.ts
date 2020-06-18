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
  GoogleGeocodingApiData,
  googleGeocodingApiEndpoint,
  getLocalityIdsFromGoogleGeocodingApiData,
  getLocalityFromCoordinates,
} from '../api/googleMaps';
import { fetchData, isUpperCased } from '../utils';

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

    if (placesData.error_message) {
      throw new Error(placesData.error_message);
    }

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
): Promise<T | null> => {
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
          return locality; // only return locality when a new locality has been created
        }
      } else {
        // console.log(`${localityName} is not a Google Places ${localityType}.`);
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
          // console.log(`Adding ${locality.name} to ${notDbNode}.`);
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
  return null;
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
    const province = findExactOrPartialMatchInDb<Province>(
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

const createSuburbFromName = async (
  suburbName: string,
  localityType: GoogleMapsApiLocalityType = GoogleMapsApiLocalityType.suburb,
  notDbNode: keyof Database = 'notSuburbs',
) => {
  const suburb = await createLocalityDataByLocalityType<Suburb>(
    localityType,
    suburbName,
    'suburbs',
    notDbNode,
  );

  if (suburb) {
    // Get the suburb's city id from geocoding api and update the suburb in the db
    const { cityId: cityName, provinceId } = await getLocalityFromCoordinates(
      `${suburb.coords.lat},${suburb.coords.lng}`,
    );

    // If the city is not already present in the db, add it
    const cityNameDb = cityName.toUpperCase();
    const cityExists = findExactOrPartialMatchInDb<City>('cities', cityNameDb, [
      'name',
      'alternateNames',
    ]);
    let cityId = cityExists?.id;
    if (!cityExists) {
      const localityId = shortid();
      const locality: City = {
        id: localityId,
        name: cityNameDb,
        provinceId,
        coords: suburb.coords,
        googlePlaceId: '',
      };
      db.set(`cities.${localityId}`, locality).write();
      console.log(`Added new city: ${cityNameDb}.`);
      cityId = localityId;
    }

    if (!cityId) {
      throw new Error('No city id.');
    }

    db.update(`suburbs.${suburb.id}`, (existingData: Suburb) => {
      return {
        ...existingData,
        cityId,
      };
    });
  }
};

const createSuburbsFromSuburbsCsv = async () => {
  const suburbsArray: SuburbCsv[] = await csvtojson().fromFile(
    path.join(__dirname, '../../../suburbs-south-africa.csv'),
  );

  for (const item of suburbsArray) {
    await createSuburbFromName(item.Town);
  }
};

const createSuburbsFromNotCitiesDb = async () => {
  // Try to see if any of the "notCities" are suburbs
  const notCities = db.get('notCities').value();
  const notCitiesArray = Object.keys(notCities).map(key => notCities[key]);

  for (const item of notCitiesArray) {
    await createSuburbFromName(item.name);
  }
};

const createSuburbsFromNotSuburbsDb = async () => {
  // Try see if there are any Google Places "neighborhoods" in the "notSuburbs" db and add those to suburbs
  const notSuburbs = db.get('notSuburbs').value();
  const notSuburbsArray = Object.keys(notSuburbs).map(key => notSuburbs[key]);

  for (const item of notSuburbsArray) {
    await createSuburbFromName(
      item.name,
      GoogleMapsApiLocalityType.neighborhood,
      'notNeighborhoodsOrSuburbs',
    );
  }
};

const validateLocality = (
  locality: Locality,
  dbNode: keyof Database,
  childDbNode: keyof Database,
  childKey: string,
  localityType: GoogleMapsApiLocalityType,
) => {
  if (locality.name) {
    const duplicates: Locality[] = db
      .get(dbNode)
      // @ts-ignore filter does exist
      .filter((item: Locality) => item.name === locality.name)
      .value();

    if (duplicates.length > 1) {
      // Select the first one to keep
      const selectedDuplicate = duplicates[0];

      for (const duplicate of duplicates) {
        if (duplicate.id !== selectedDuplicate.id) {
          if (childDbNode && childKey) {
            // Find all child nodes that have the duplicates id as a value for childKey
            // Replace it with the selectedDuplicates id (since we're deleting the other duplicates)
            const associatedChildNodes = db
              .get(childDbNode)
              // @ts-ignore filter does exist
              .filter((item: Locality) => item[childKey] === duplicate.id)
              .value();

            for (const childNode of associatedChildNodes) {
              db.update(
                `${childDbNode}.${childNode.id}`,
                (existingData: Locality) => {
                  const newData = existingData;
                  newData[childKey] = selectedDuplicate.id;
                  return newData;
                },
              ).write();
              console.log(
                `Updated ${dbNode}.${childNode.id} ${childKey} from ${childNode[childKey]} to ${selectedDuplicate.id}`,
              );
            }
          }

          // Remove the duplicate from the db
          db.unset(`${dbNode}.${duplicate.id}`).write();
          console.log(`Removed ${dbNode}.${duplicate.id}.`);
        }
      }
    }

    // It should have an id
    if (!locality.id) {
      throw new Error(`${locality.name} does not have an id.`);
    }

    // It's name should be uppercased
    if (!isUpperCased(locality.name)) {
      throw new Error(`${locality.name}'s name is not uppercased.`);
    }

    // It should have coords
    if (!locality.coords) {
      throw new Error(`${locality.id} does not have coords.`);
    }

    // It should have a googlePlaceId
    if (!locality.googlePlaceId) {
      // TODO: Go and get it using the name
      // console.log(`${locality.id} does not have a googlePlaceId.`);
    }
  } else {
    db.unset(`${dbNode}.${locality.id}`).write();
    console.log(`Removed ${locality.id} because it did not have a name.`);
  }
};

const validateProvinces = () => {
  const provinces = db.get('provinces').value();
  const provincesArray = Object.keys(provinces).map(key => provinces[key]);

  for (const item of provincesArray) {
    validateLocality(
      item,
      'provinces',
      'cities',
      'provinceId',
      GoogleMapsApiLocalityType.province,
    );
  }

  console.log('Provinces have been successfully validated.');
};

const validateCities = () => {
  const cities = db.get('cities').value();
  const citiesArray = Object.keys(cities).map(key => cities[key]);

  for (const item of citiesArray) {
    validateLocality(
      item,
      'cities',
      'suburbs',
      'cityId',
      GoogleMapsApiLocalityType.city,
    );
  }

  console.log('Cities have been successfully validated.');
};

const validateSuburbs = () => {
  const suburbs = db.get('suburbs').value();
  const suburbsArray = Object.keys(suburbs).map(key => suburbs[key]);

  for (const item of suburbsArray) {
    validateLocality(
      item,
      'suburbs',
      null,
      null,
      GoogleMapsApiLocalityType.suburb,
    );
  }

  console.log('Suburbs have been successfully validated.');
};

export const createLocalityData = async () => {
  // Resets
  // db.unset('provinces').write();
  // db.unset('notProvinces').write();
  // db.unset('cities').write();
  // db.unset('notCities').write();
  // db.unset('suburbs').write();
  // db.unset('notSuburbs').write();
  // db.set('googlePlacesApiCalls', 0).write();

  // await createProvinces();
  // await createCities();
  // await createSuburbsFromSuburbsCsv();
  // await createSuburbsFromNotCitiesDb();
  // await createSuburbsFromNotSuburbsDb();

  // await validateProvinces();
  // await validateCities();
  // await validateSuburbs();

  console.log(
    `We have ${db.get('provinces').size()} provinces, ${db
      .get('cities')
      .size()} cities, ${db.get('notCities').size()} notCities, ${db
      .get('suburbs')
      .size()} suburbs and ${db
      .get('notSuburbs')
      .size()} notSuburbs. Total Google Places API calls: ${db
      .get('googlePlacesApiCalls')
      .value()}`,
  );
};
