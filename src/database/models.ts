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

export interface Locality {
  streetNumber: string;
  street: string;
  suburbId: SuburbId;
  cityId: CityId;
  provinceId: ProvinceId;
}

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

export type ProvinceId = string;
export interface Province {
  name: string;
}

export type CityId = string;
export interface City {
  name: string;
  modernName?: string;
  provinceId: string;
}

export type SuburbId = string;
export interface Suburb {
  name: string;
  cityId: string;
}

export interface Database {
  auctionLinks: AuctionLink[];
  auctions: Record<string, AuctionData>;
  properties: Record<string, PropertyData>;
  provinces: Record<ProvinceId, Province>;
  cities: Record<CityId, City>;
  suburbs: Record<SuburbId, Suburb>;
}

export const initialState: Database = {
  auctionLinks: [],
  auctions: {},
  properties: {},
  provinces: {},
  cities: {},
  suburbs: {},
};
