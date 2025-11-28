/**
 * Formats a number as a GBP currency string
 * @param price - The price to format
 * @returns Formatted price string (e.g., "£12.34")
 */
export function formatPrice(price: number): string {
    return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
    }).format(price);
}

/**
 * Generates a search URL for a specific platform and barcode
 * @param platform - The platform to search on (ebay, abebooks, amazon)
 * @param barcode - The barcode to search for
 * @returns The search URL for the platform
 */
export function generateSearchUrl(platform: string, barcode: string): string {
    switch (platform) {
        case "ebay":
            return `https://www.ebay.co.uk/sch/i.html?_nkw=${barcode}`;
        case "abebooks":
            return `https://www.abebooks.co.uk/servlet/SearchResults?sts=t&an=&tn=&isbn=${barcode}`;
        case "amazon":
            return `https://www.amazon.co.uk/s?k=${barcode}`;
        default:
            return "#";
    }
}
