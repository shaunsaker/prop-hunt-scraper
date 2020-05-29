import { PropertyData } from '../database/models';
import { TargetDataItem } from '../scrapeTargetData';

export const targetData: TargetDataItem<PropertyData>[] = [
  {
    key: 'propertyType',
    selector:
      '#main > div.box-bg > table > tbody > tr:nth-child(1) > td:nth-child(2) > font',
  },
  {
    key: 'erfNumber',
    selector:
      '#main > div.box-bg > table > tbody > tr:nth-child(2) > td:nth-child(2) > font',
  },
  {
    key: 'registeredSize',
    selector:
      '#main > div.box-bg > table > tbody > tr:nth-child(2) > td:nth-child(4) > font',
  },
  {
    key: 'portionNumber',
    selector:
      '#main > div.box-bg > table > tbody > tr:nth-child(3) > td:nth-child(2) > font',
  },
  {
    key: 'municipality',
    selector:
      '#main > div.box-bg > table > tbody > tr:nth-child(3) > td:nth-child(4) > font',
  },
  {
    key: 'township',
    selector:
      '#main > div.box-bg > table > tbody > tr:nth-child(4) > td:nth-child(2) > font',
  },
  {
    key: 'province',
    selector:
      '#main > div.box-bg > table > tbody > tr:nth-child(4) > td:nth-child(4) > font',
  },
  {
    key: 'registrationDivision',
    selector:
      '#main > div.box-bg > table > tbody > tr:nth-child(5) > td:nth-child(2) > font',
  },
  {
    key: 'coordinates',
    selector:
      '#main > div.box-bg > table > tbody > tr:nth-child(5) > td:nth-child(4) > font',
  },
  {
    key: 'deedsOffice',
    selector:
      '#main > div.box-bg > table > tbody > tr:nth-child(6) > td:nth-child(2) > font',
  },
  {
    key: 'titleDeed',
    selector:
      '#main > div.box-bg > table > tbody > tr:nth-child(6) > td:nth-child(4) > font',
  },
  {
    key: 'lastSellingPrice',
    selector:
      '#main > div.box-bg > table > tbody > tr:nth-child(7) > td:nth-child(2) > b > font',
  },
  {
    key: 'dateSold',
    selector:
      '#main > div.box-bg > table > tbody > tr:nth-child(7) > td:nth-child(4) > font',
  },
  {
    key: 'bedrooms',
    selector:
      '#main > div.box-bg > table > tbody > tr:nth-child(8) > td > div > b:nth-child(2)',
  },
  {
    key: 'bathrooms',
    selector:
      '#main > div.box-bg > table > tbody > tr:nth-child(8) > td > div > b:nth-child(4)',
  },
  {
    key: 'livingRooms',
    selector:
      '#main > div.box-bg > table > tbody > tr:nth-child(8) > td > div > b:nth-child(6)',
  },
  {
    key: 'garages',
    selector:
      '#main > div.box-bg > table > tbody > tr:nth-child(8) > td > div > b:nth-child(8)',
  },
];
