import { CaseAuctionData, TargetDataItem } from '../database/models';

export const targetData: TargetDataItem<CaseAuctionData>[] = [
  {
    key: 'auctionVenue',
    selector:
      '#main > div:nth-child(8) > table > tbody > tr:nth-child(1) > td:nth-child(2) > font:nth-child(1)',
  },
  {
    key: 'propertyHref',
    selector:
      '#main > div:nth-child(8) > table > tbody > tr:nth-child(2) > td:nth-child(2) > a',
    href: true,
  },
  {
    key: 'auctionDate',
    selector:
      '#main > div:nth-child(8) > table > tbody > tr:nth-child(3) > td:nth-child(2) > font',
  },
  {
    key: 'titleDeed',
    selector:
      '#main > div:nth-child(8) > table > tbody > tr:nth-child(4) > td:nth-child(2) > font',
  },
  {
    key: 'caseNumber',
    selector:
      '#main > div:nth-child(8) > table > tbody > tr:nth-child(5) > td:nth-child(2) > a',
  },
  {
    key: 'publicNoticeHref',
    selector:
      '#main > div:nth-child(8) > table > tbody > tr:nth-child(2) > td:nth-child(2) > a',
    href: true,
  },
  {
    key: 'sheriffUnparsedId',
    selector: '#main > div:nth-child(9) > a > font',
  },
  {
    key: 'sheriffName',
    selector:
      '#main > div:nth-child(10) > table > tbody > tr:nth-child(1) > td:nth-child(2) > font',
  },
  {
    key: 'sheriffPhone',
    selector:
      '#main > div:nth-child(10) > table > tbody > tr:nth-child(2) > td:nth-child(2) > font',
  },
  {
    key: 'sheriffCell',
    selector:
      '#main > div:nth-child(10) > table > tbody > tr:nth-child(3) > td:nth-child(2) > font',
  },
  {
    key: 'sheriffEmail',
    selector:
      '#main > div:nth-child(10) > table > tbody > tr:nth-child(4) > td:nth-child(2) > font',
  },
  {
    key: 'sheriffPOBox',
    selector:
      '#main > div:nth-child(10) > table > tbody > tr:nth-child(5) > td:nth-child(2) > font',
  },
  {
    key: 'attorneyUnparsedLine1',
    selector:
      '#main > div:nth-child(12) > table > tbody > tr:nth-child(1) > td:nth-child(2) > font',
  },
  {
    key: 'attorneyUnparsedLine2',
    selector:
      '#main > div:nth-child(12) > table > tbody > tr:nth-child(2) > td:nth-child(2) > font',
  },
  {
    key: 'attorneyUnparsedLine3',
    selector:
      '#main > div:nth-child(12) > table > tbody > tr:nth-child(3) > td:nth-child(2) > font',
  },
  {
    key: 'attorneyUnparsedLine4',
    selector:
      '#main > div:nth-child(12) > table > tbody > tr:nth-child(4) > td:nth-child(2) > font',
  },
  {
    key: 'attorneyUnparsedLine5',
    selector:
      '#main > div:nth-child(12) > table > tbody > tr:nth-child(5) > td:nth-child(2) > font',
  },
];
