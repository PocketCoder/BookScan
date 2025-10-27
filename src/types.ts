export interface ItemData {
  price: number;
  link: string;
  quality?: string;
  format?: string;
}

export interface BookDetails {
  title?: string;
  authors?: string[];
  coverImage?: string;
  format?: string;
}

export interface ScraperResults {
  bookDetails: BookDetails;
  ebay: { items: ItemData[] };
  abeBooks: { items: ItemData[] };

  amazon: { items: ItemData[] };
  summary: {
    minItem: ItemData;
    averageItem: ItemData | null;
    highestItem: ItemData;
  };
}
