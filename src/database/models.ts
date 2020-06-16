export interface AuctionLink {
  href: string;
  text: string; // used as id in CaseAuctinoData
}

export interface AuctionData {
  id: string;
  href: string;
  auctionVenue: string;
  propertyHref: string; // get from propertyOnAuction
  auctionDate: string;
  titleDeed: string;
  caseNumber: string;
  publicNoticeHref: string; // get from caseNumber
  sheriffUnparsedId: string;
  sheriffName: string;
  sheriffPhone: string;
  sheriffCell: string;
  sheriffEmail: string;
  sheriffPOBox: string;
  attorneyUnparsedLine1: string;
  attorneyUnparsedLine2: string;
  attorneyUnparsedLine3: string;
  attorneyUnparsedLine4: string;
  attorneyUnparsedLine5: string;
}

// export interface Locality {
//   streetNumber: string;
//   street: string;
//   suburbId: SuburbId;
//   cityId: CityId;
//   provinceId: ProvinceId;
// }

export interface PropertyData extends Locality {
  id: string;
  href: string;
  propertyType: string;
  erfNumber: string;
  registeredSize: string;
  portionNumber: string;
  municipality: string;
  township: string;
  province: string;
  registrationDivision: string;
  coordinates: string;
  deedsOffice: string;
  titleDeed: string;
  lastSellingPrice: string;
  dateSold: string;
  bedrooms: string;
  bathrooms: string;
  livingRooms: string;
  garages: string;
}

export interface Locality {
  id: string;
  name: string;
  alternateNames?: string[];
  coords: {
    lat: number;
    lng: number;
  };
  googlePlaceId: string;
}

export type ProvinceId = string;
export type Province = Locality;

export type CityId = string;
export interface City extends Locality {
  provinceId: string;
}

export type SuburbId = string;
export interface Suburb extends Locality {
  cityId: string;
}

export interface Database {
  auctionLinks: AuctionLink[];
  auctions: Record<string, AuctionData>;
  properties: Record<string, PropertyData>;
  provinces: Record<ProvinceId, Province>;
  notProvinces: Record<ProvinceId, Province>;
  cities: Record<CityId, City>;
  notCities: Record<CityId, City>;
  suburbs: Record<SuburbId, Suburb>;
  notSuburbs: Record<SuburbId, Suburb>;
  googlePlacesApiCalls: number;
}

export const initialState: Database = {
  auctionLinks: [],
  auctions: {},
  properties: {},
  provinces: {},
  notProvinces: {},
  cities: {},
  notCities: {},
  suburbs: {},
  notSuburbs: {},
  googlePlacesApiCalls: 0,
};
