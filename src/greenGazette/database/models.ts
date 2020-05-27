export interface CaseLink {
  href: string;
  text: string;
}

export interface CaseAuctionData {
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

export interface CasePropertyData {}

export interface CaseData {
  auction: {
    venue: string;
    date: string;
  };
  sheriff: {
    id: string;
    name: string;
    phone: string;
    cell: string;
    email: string;
    poBox: string;
  };
  attoryney: {
    name: string;
    address: string;
    tel: string;
    fax: string;
  };
}
