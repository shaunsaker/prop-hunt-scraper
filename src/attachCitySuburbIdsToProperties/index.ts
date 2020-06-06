import axios from 'axios';
import * as promptly from 'promptly';
import { db, findExactOrPartialMatchInDb } from '../database';
import { PropertyData, Suburb, City } from '../database/models';
import { getPropertyId } from '../getPropertiesData';
import { isObjectEmpty } from '../utils';
import {
  MapItApiData,
  getApiValueFromKey,
  MapItApiDataKeys,
  mapItPointEndpoint,
} from '../api/mapIt';

const parsePropertyCoordinates = (coordinates: string, reverse?: boolean) => {
  const arr = coordinates.split(' / ');
  const sortedArr = reverse ? arr.reverse() : arr;

  return sortedArr.join(',');
};

const getSuburbFromUserInput = async (
  property: PropertyData,
  data: MapItApiData,
) => {
  console.log({ property, data });
  let suburbFromApi = '';
  let cityFromApi = '';

  if (!isObjectEmpty(data)) {
    suburbFromApi = getApiValueFromKey(data, MapItApiDataKeys.Suburb);
    cityFromApi = getApiValueFromKey(data, MapItApiDataKeys.City).replace(
      'CITY OF ',
      '',
    );
  }

  const latLng = parsePropertyCoordinates(property.coordinates);
  const propertyTownship = property.township.toUpperCase();
  let suburbFromUser;

  // If both sources match, don't bother asking for user input
  // Sometimes suburbFromApi includes the township name with e.g. SP, or NU
  if (
    propertyTownship &&
    suburbFromApi &&
    (propertyTownship === suburbFromApi ||
      suburbFromApi.includes(propertyTownship))
  ) {
    suburbFromUser = propertyTownship;
  } else {
    const choices = [propertyTownship, suburbFromApi];
    suburbFromUser = await promptly.prompt(
      `The city might be ${cityFromApi}.\nHere's the Google Map: https://www.google.co.za/maps/@${latLng},11z\nWhich suburb should we use/add? ${choices[0]} or ${choices[1]}.`,
    );
  }

  let cityFromUser = cityFromApi;

  if (!cityFromUser) {
    cityFromUser = await promptly.prompt('Which city should we use/add?');
  }

  // Add the suburb if it doesn't already exist
  const suburbInDb = db.get(`suburbs.${suburbFromUser}`).value();
  if (!suburbInDb) {
    const newSuburbData: Suburb = {
      name: suburbFromUser,
      cityId: cityFromApi,
    };
    db.get('suburbs')
      .set(suburbFromUser, newSuburbData)
      .write();
  }

  // Add the city if it doesn't already exist
  const cityInDb = db.get(`cities.${cityFromUser}`).value();
  if (!cityInDb) {
    const newCityData: City = { name: cityFromUser };
    db.get('cities')
      .set(cityFromUser, newCityData)
      .write();
  }

  return { suburbId: suburbFromUser, cityId: cityFromUser };
};

const getSuburbCityIdsFromProperty = async (
  property: PropertyData,
  data: MapItApiData,
) => {
  // There is no data, probably from coordinates that were set to 0,0
  // Use the property township
  const propertyTownship = property.township.toUpperCase();
  if (!propertyTownship) {
    console.log('No property township.');
    return await getSuburbFromUserInput(property, data);
  }

  const suburbInDb = findExactOrPartialMatchInDb(
    'suburbs',
    propertyTownship,
  ) as Suburb;

  if (!suburbInDb) {
    console.log('No suburb found.');
    return await getSuburbFromUserInput(property, data);
  }

  return {
    suburbId: suburbInDb.name,
    cityId: suburbInDb.cityId,
  };
};

const getSuburbCityIdsFromApiData = async (
  data: MapItApiData,
  property: PropertyData,
) => {
  if (isObjectEmpty(data)) {
    return getSuburbCityIdsFromProperty(property, data);
  }

  const suburbFromApi = getApiValueFromKey(data, MapItApiDataKeys.Suburb);
  const suburbInDb = findExactOrPartialMatchInDb(
    'suburbs',
    suburbFromApi,
  ) as Suburb;

  if (!suburbInDb) {
    return getSuburbCityIdsFromProperty(property, data);
  }

  return { suburbId: suburbInDb.name, cityId: suburbInDb.cityId };
};

const attachCitySuburbIdsToProperty = async (property: PropertyData) => {
  const lngLat = parsePropertyCoordinates(property.coordinates, true);
  const url = `${mapItPointEndpoint}/${lngLat}`;
  console.log(`Fetching city suburb data from ${url}`);
  const response = await axios.get(url);
  const data: MapItApiData = response.data;
  const { suburbId, cityId } = await getSuburbCityIdsFromApiData(
    data,
    property,
  );
  console.log(`Found suburbId: ${suburbId}, cityId: ${cityId}`);

  const propertyId = getPropertyId(null, property);
  db.update(`properties.${propertyId}`, existingData => {
    return {
      ...existingData,
      cityId,
      suburbId,
    };
  }).write();
};

export const attachCitySuburbIdsToProperties = async () => {
  const propertiesData = db.get('properties').value();
  const propertiesDataArray: PropertyData[] = Object.keys(propertiesData).map(
    key => propertiesData[key],
  );

  let count = 0;
  for (const property of propertiesDataArray) {
    count += 1;
    console.log(`Processing property: ${count}`);

    if (property.coordinates && !property.suburbId && !property.cityId) {
      await attachCitySuburbIdsToProperty(property);
    } else if (!property.coordinates) {
      throw new Error('No coordinates.');
    }
  }
};
