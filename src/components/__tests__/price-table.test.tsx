import React from 'react';
import { render, screen } from '@testing-library/react';
import { PriceTable } from '../price-table';
import { ItemData } from '@/types';
import userEvent from '@testing-library/user-event';

// Mock window.open
const mockWindowOpen = jest.fn();
global.window.open = mockWindowOpen;

describe('PriceTable', () => {
    const mockItems: ItemData[] = [
        {
            price: 12.99,
            link: 'https://example.com/item1',
            quality: 'Good',
            format: 'Paperback',
        },
        {
            price: 15.50,
            link: 'https://example.com/item2',
            quality: 'Very Good',
            format: 'Hardcover',
        },
    ];

    beforeEach(() => {
        mockWindowOpen.mockClear();
    });

    it('should render platform title', () => {
        render(
            <PriceTable
                platform="ebay"
                platformDisplay="eBay"
                items={mockItems}
                barcode="9780545010221"
            />
        );

        expect(screen.getByText('eBay')).toBeInTheDocument();
    });

    it('should render items in table', () => {
        render(
            <PriceTable
                platform="ebay"
                platformDisplay="eBay"
                items={mockItems}
                barcode="9780545010221"
            />
        );

        expect(screen.getByText('£12.99')).toBeInTheDocument();
        expect(screen.getByText('£15.50')).toBeInTheDocument();
        expect(screen.getByText('Good')).toBeInTheDocument();
        expect(screen.getByText('Paperback')).toBeInTheDocument();
    });

    it('should render table headers', () => {
        render(
            <PriceTable
                platform="ebay"
                platformDisplay="eBay"
                items={mockItems}
                barcode="9780545010221"
            />
        );

        expect(screen.getByText('Price')).toBeInTheDocument();
        expect(screen.getByText('Condition')).toBeInTheDocument();
        expect(screen.getByText('Format')).toBeInTheDocument();
        expect(screen.getByText('Link')).toBeInTheDocument();
    });

    it('should render View links for each item', () => {
        render(
            <PriceTable
                platform="ebay"
                platformDisplay="eBay"
                items={mockItems}
                barcode="9780545010221"
            />
        );

        const viewLinks = screen.getAllByText('View');
        expect(viewLinks).toHaveLength(2);
        expect(viewLinks[0]).toHaveAttribute('href', 'https://example.com/item1');
    });

    it('should display N/A for missing quality and format', () => {
        const itemsWithoutQuality: ItemData[] = [
            {
                price: 10.0,
                link: 'https://example.com/item',
            },
        ];

        render(
            <PriceTable
                platform="amazon"
                platformDisplay="Amazon"
                items={itemsWithoutQuality}
                barcode="9780545010221"
            />
        );

        const naElements = screen.getAllByText('N/A');
        expect(naElements.length).toBeGreaterThanOrEqual(2);
    });

    it('should show empty state when no items', () => {
        render(
            <PriceTable
                platform="ebay"
                platformDisplay="eBay"
                items={[]}
                barcode="9780545010221"
            />
        );

        expect(screen.getByText('No eBay items found.')).toBeInTheDocument();
    });

    it('should render search button when barcode is provided', () => {
        render(
            <PriceTable
                platform="ebay"
                platformDisplay="eBay"
                items={mockItems}
                barcode="9780545010221"
            />
        );

        expect(screen.getByText('Search eBay')).toBeInTheDocument();
    });

    it('should not render search button when barcode is null', () => {
        render(
            <PriceTable
                platform="ebay"
                platformDisplay="eBay"
                items={mockItems}
                barcode={null}
            />
        );

        expect(screen.queryByText('Search eBay')).not.toBeInTheDocument();
    });

    it('should open search URL when search button is clicked', async () => {
        const user = userEvent.setup();

        render(
            <PriceTable
                platform="ebay"
                platformDisplay="eBay"
                items={mockItems}
                barcode="9780545010221"
            />
        );

        const searchButton = screen.getByText('Search eBay');
        await user.click(searchButton);

        expect(mockWindowOpen).toHaveBeenCalledWith(
            'https://www.ebay.co.uk/sch/i.html?_nkw=9780545010221',
            '_blank'
        );
    });
});
