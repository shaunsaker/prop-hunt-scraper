enum GoogleMapsApiLocalityType {
  'street_number' = 'street_number',
  street = 'route',
  suburb = 'sublocality',
  city = 'locality',
  province = 'administrative_area_level_1',
}

export interface GoogleMapsAddressComponent {
  long_name: string;
  types: GoogleMapsApiLocalityType[];
}

export interface GoogleGeocodingApiResult {
  address_components: GoogleMapsAddressComponent[];
}

export interface GoogleGeocodingApiData {
  results: GoogleGeocodingApiResult[];
}

export interface GooglePlacesCandidate {
  geometry: {
    location: {
      lat: string;
      lng: string;
    };
  };
}

export type GooglePlacesApiData = {
  candidates: GooglePlacesCandidate[];
};

export const googleGeocodingApiEndpoint = `https://maps.googleapis.com/maps/api/geocode/json?key=${process.env.GOOGLE_MAPS_API_KEY}&latlng=`;
export const googlePlacesApiEndpoint = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?inputtype=textquery&fields=geometry&key=${process.env.GOOGLE_MAPS_API_KEY}&input=`;

const removeSuburbAcronym = (string: string): string => {
  return string.replace(/( ?-? [A-Z]+[A-Z.])/g, '');
};

const getGoogleMapsApiLocalityType = (
  data: GoogleGeocodingApiData,
  localityType: GoogleMapsApiLocalityType,
): string => {
  const localityData = data.results[0].address_components.filter(item =>
    item.types.includes(localityType),
  )[0];

  if (localityData) {
    return removeSuburbAcronym(localityData.long_name);
  }

  return '';
};

export const getLocalityIdsFromGoogleGeocodingApiData = (
  data: GoogleGeocodingApiData,
): {
  streetNumber: string;
  street: string;
  suburbId: string;
  cityId: string;
  provinceId: string;
} => {
  const streetNumber = getGoogleMapsApiLocalityType(
    data,
    GoogleMapsApiLocalityType.street_number,
  );
  const street = getGoogleMapsApiLocalityType(
    data,
    GoogleMapsApiLocalityType.street,
  );
  const suburbId = getGoogleMapsApiLocalityType(
    data,
    GoogleMapsApiLocalityType.suburb,
  );
  const cityId = getGoogleMapsApiLocalityType(
    data,
    GoogleMapsApiLocalityType.city,
  );
  const provinceId = getGoogleMapsApiLocalityType(
    data,
    GoogleMapsApiLocalityType.province,
  );

  return {
    streetNumber,
    street,
    suburbId,
    cityId,
    provinceId,
  };
};