import axios from 'axios';
import * as promptly from 'promptly';
import { db, findExactOrPartialMatchInDb } from '../database';
import {
  PropertyData,
  Locality,
  Database,
  Province,
  City,
  Suburb,
} from '../database/models';
import {
  googleGeocodingApiEndpoint,
  GoogleGeocodingApiData,
  getLocalityIdsFromGoogleGeocodingApiData,
  googlePlacesApiEndpoint,
  GooglePlacesApiData,
} from '../api/googleMaps';
import { getPropertyId } from '../getPropertiesData';
import { fetchData } from '../utils';

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

const verifyOrCreateLocalityInDb = async (
  localityId: string,
  dbNode: keyof Database,
  locality: Locality,
): Promise<Locality> => {
  const localityExists = findExactOrPartialMatchInDb(dbNode, localityId, [
    'alternateNames',
  ]);
  if (localityExists) {
    return locality;
  } else {
    // TODO: Only ask in development
    const shouldAddLocality = await promptly.prompt(
      `${localityId} does not exist in ${dbNode}. Would you like to add it? (y/n)`,
    );

    if (shouldAddLocality === 'y') {
      const data: any = {
        name: localityId,
      };
      if (dbNode === 'suburbs') {
        data.cityId = locality.cityId;
      } else if (dbNode === 'cities') {
        data.provinceId = locality.provinceId;
      }

      // db.get(dbNode)
      //   .set(localityId.toUpperCase(), data)
      //   .write();

      console.log(`Added ${localityId} to ${dbNode}.`);
    }
    return locality;
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

      if (locality.suburbId) {
        locality = await verifyOrCreateLocalityInDb(
          locality.suburbId,
          'suburbs',
          locality,
        );
      }
      if (locality.cityId) {
        locality = await verifyOrCreateLocalityInDb(
          locality.cityId,
          'cities',
          locality,
        );
      }
      if (locality.provinceId) {
        locality = await verifyOrCreateLocalityInDb(
          locality.provinceId,
          'provinces',
          locality,
        );
      }

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
