import axios from 'axios';
import * as promptly from 'promptly';
import { db } from '../database';
import { PropertyData, Locality, Database } from '../database/models';
import {
  googleGeocodingApiEndpoint,
  GoogleGeocodingApiData,
  getLocalityIdsFromGoogleGeocodingApiData,
  googlePlacesApiEndpoint,
  GooglePlacesApiData,
} from '../api/googleMaps';
import { getPropertyId } from '../getPropertiesData';

const parsePropertyCoordinates = (
  coordinates: string,
  reverse?: boolean,
): string => {
  // Some of the data has coords set to this value, we don't want to return it because then
  // there would be an api call
  // Let's rather return nothing
  if (coordinates === '0.000000 / 0.000000') {
    return '';
  }

  const arr = coordinates.split(' / ');
  const sortedArr = reverse ? arr.reverse() : arr;

  return sortedArr.join(',');
};

const fetchData = async <T>(url: string): Promise<T> => {
  console.log(`Fetching data from ${url}`);
  const response = await axios.get(url);
  const data: T = response.data;

  return data;
};

const verifyOrCreateLocalityInDb = async (
  localityId: string,
  dbNode: keyof Database,
) => {
  const localityExists = Boolean(
    db.get(`${dbNode}.${localityId.toUpperCase()}`).value(),
  );
  if (localityExists) {
    return;
  } else {
    throw new Error(`${localityId} does not exist in ${dbNode}.`);
  }
};

const getLocalityFromCoordinates = async (coordinates: string) => {
  const url = `${googleGeocodingApiEndpoint}${coordinates}`;
  const data = await fetchData<GoogleGeocodingApiData>(url);

  return getLocalityIdsFromGoogleGeocodingApiData(data);
};

const getLocalityFromTownship = async (township: string) => {
  // First get a place match
  const placesUrl = `${googlePlacesApiEndpoint}${township} South Africa`;
  const placesData = await fetchData<GooglePlacesApiData>(placesUrl);

  // Then get locality using the coords
  const { lat, lng } = placesData.candidates[0].geometry.location;
  const geocodingUrl = `${googleGeocodingApiEndpoint}${lat},${lng}`;
  const geocodingData = await fetchData<GoogleGeocodingApiData>(geocodingUrl);

  // In this instance, we don't want to return a street number or street since it's the coords of the township/suburb
  const localityIds = getLocalityIdsFromGoogleGeocodingApiData(geocodingData);
  localityIds.streetNumber = '';
  localityIds.street = '';

  return localityIds;
};

export const getLocalityDataForProperties = async () => {
  const propertiesData = db.get('properties').value();
  const propertiesDataArray: PropertyData[] = Object.keys(propertiesData)
    .map(key => propertiesData[key])
    .slice(0, 10);

  let count = 0;
  for (const property of propertiesDataArray) {
    count += 1;
    console.log(`Processing property: ${count}`);

    // TODO: && !property.suburbId && !property.cityId
    if (property.coordinates) {
      const coordinates = parsePropertyCoordinates(property.coordinates);
      let locality: Locality;

      if (coordinates) {
        locality = await getLocalityFromCoordinates(coordinates);
      } else if (property.township) {
        locality = await getLocalityFromTownship(property.township);
      } else {
        throw new Error('No coords or township');
      }

      console.log(
        `Found streetNumber: ${locality?.streetNumber}, street: ${locality?.street}, suburbId: ${locality?.suburbId}, cityId: ${locality?.cityId}, provinceId: ${locality?.provinceId}`,
      );

      await verifyOrCreateLocalityInDb(locality.suburbId, 'suburbs');
      await verifyOrCreateLocalityInDb(locality.cityId, 'cities');
      await verifyOrCreateLocalityInDb(locality.provinceId, 'provinces');

      // const propertyId = getPropertyId(null, property);
      // db.update(
      //   `properties.${propertyId}`,
      //   (existingData: PropertyData): PropertyData => {
      //     return {
      //       ...existingData,
      //       ...locality,
      //     };
      //   },
      // ).write();
    } else if (!property.coordinates) {
      throw new Error('No coordinates.');
    }
  }
};
