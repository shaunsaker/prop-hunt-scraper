export enum MapItApiDataKeys {
  Suburb = 'SubPlace',
  City = 'Municipality',
}

export interface MapItApiDataPoint {
  type_name: MapItApiDataKeys;
  name: string;
}

export type MapItApiData = Record<string, MapItApiDataPoint>;

export const mapItPointEndpoint = 'https://mapit.code4sa.org/point/4326';

export const getApiValueFromKey = (
  data: MapItApiData,
  idType: MapItApiDataKeys,
) => {
  return data[
    Object.keys(data).filter(key => data[key].type_name === idType)[0]
  ].name.toUpperCase();
};
