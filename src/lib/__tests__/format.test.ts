import { formatPrice, generateSearchUrl } from '../format';

describe('formatPrice', () => {
    it('should format price correctly in GBP', () => {
        expect(formatPrice(12.34)).toBe('£12.34');
    });

    it('should handle zero price', () => {
        expect(formatPrice(0)).toBe('£0.00');
    });

    it('should handle large prices', () => {
        expect(formatPrice(1234.56)).toBe('£1,234.56');
    });

    it('should round to 2 decimal places', () => {
        expect(formatPrice(9.999)).toBe('£10.00');
    });

    it('should handle single decimal place', () => {
        expect(formatPrice(5.5)).toBe('£5.50');
    });

    it('should handle negative prices', () => {
        expect(formatPrice(-10.50)).toBe('-£10.50');
    });
});

describe('generateSearchUrl', () => {
    it('should generate correct eBay search URL', () => {
        const url = generateSearchUrl('ebay', '9780545010221');
        expect(url).toBe('https://www.ebay.co.uk/sch/i.html?_nkw=9780545010221');
    });

    it('should generate correct AbeBooks search URL', () => {
        const url = generateSearchUrl('abebooks', '9780545010221');
        expect(url).toBe(
            'https://www.abebooks.co.uk/servlet/SearchResults?sts=t&an=&tn=&isbn=9780545010221'
        );
    });

    it('should generate correct Amazon search URL', () => {
        const url = generateSearchUrl('amazon', '9780545010221');
        expect(url).toBe('https://www.amazon.co.uk/s?k=9780545010221');
    });

    it('should return # for unknown platform', () => {
        const url = generateSearchUrl('unknown', '9780545010221');
        expect(url).toBe('#');
    });

    it('should handle special characters in barcode', () => {
        const url = generateSearchUrl('ebay', 'test-123+456');
        expect(url).toBe('https://www.ebay.co.uk/sch/i.html?_nkw=test-123+456');
    });
});
