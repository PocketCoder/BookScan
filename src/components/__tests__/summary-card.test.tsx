import React from 'react';
import { render, screen } from '@testing-library/react';
import { SummaryCard } from '../summary-card';
import { ItemData } from '@/types';

describe('SummaryCard', () => {
    const mockMinItem: ItemData = {
        price: 5.99,
        link: 'https://example.com/min',
    };

    const mockAverageItem: ItemData = {
        price: 10.50,
        link: '#',
    };

    const mockHighestItem: ItemData = {
        price: 15.99,
        link: 'https://example.com/max',
    };

    it('should render summary title', () => {
        render(
            <SummaryCard
                minItem={mockMinItem}
                averageItem={mockAverageItem}
                highestItem={mockHighestItem}
            />
        );

        expect(screen.getByText('Summary')).toBeInTheDocument();
    });

    it('should display lowest price with link', () => {
        render(
            <SummaryCard
                minItem={mockMinItem}
                averageItem={mockAverageItem}
                highestItem={mockHighestItem}
            />
        );

        const lowestPriceLink = screen.getByText('£5.99');
        expect(lowestPriceLink).toBeInTheDocument();
        expect(lowestPriceLink).toHaveAttribute('href', 'https://example.com/min');
    });

    it('should display average price', () => {
        render(
            <SummaryCard
                minItem={mockMinItem}
                averageItem={mockAverageItem}
                highestItem={mockHighestItem}
            />
        );

        expect(screen.getByText(/Average Price:/)).toBeInTheDocument();
        expect(screen.getByText(/£10.50/)).toBeInTheDocument();
    });

    it('should display highest price with link', () => {
        render(
            <SummaryCard
                minItem={mockMinItem}
                averageItem={mockAverageItem}
                highestItem={mockHighestItem}
            />
        );

        const highestPriceLink = screen.getByText('£15.99');
        expect(highestPriceLink).toBeInTheDocument();
        expect(highestPriceLink).toHaveAttribute('href', 'https://example.com/max');
    });

    it('should handle null average item', () => {
        render(
            <SummaryCard
                minItem={mockMinItem}
                averageItem={null}
                highestItem={mockHighestItem}
            />
        );

        expect(screen.queryByText(/Average Price:/)).not.toBeInTheDocument();
    });

    it('should not render lowest price if link is missing', () => {
        const minItemWithoutLink = { ...mockMinItem, link: '' };

        render(
            <SummaryCard
                minItem={minItemWithoutLink}
                averageItem={mockAverageItem}
                highestItem={mockHighestItem}
            />
        );

        expect(screen.queryByText(/Lowest Price:/)).not.toBeInTheDocument();
    });

    it('should not render highest price if link is missing', () => {
        const highestItemWithoutLink = { ...mockHighestItem, link: '' };

        render(
            <SummaryCard
                minItem={mockMinItem}
                averageItem={mockAverageItem}
                highestItem={highestItemWithoutLink}
            />
        );

        expect(screen.queryByText(/Highest Price:/)).not.toBeInTheDocument();
    });

    it('should format prices correctly', () => {
        const minItem: ItemData = { price: 1.5, link: '#' };
        const averageItem: ItemData = { price: 100.99, link: '#' };
        const highestItem: ItemData = { price: 1234.56, link: '#' };

        render(
            <SummaryCard
                minItem={minItem}
                averageItem={averageItem}
                highestItem={highestItem}
            />
        );

        expect(screen.getByText('£1.50')).toBeInTheDocument();
        expect(screen.getByText(/£100.99/)).toBeInTheDocument();
        expect(screen.getByText('£1,234.56')).toBeInTheDocument();
    });

    it('should use grid layout for summary items', () => {
        const { container } = render(
            <SummaryCard
                minItem={mockMinItem}
                averageItem={mockAverageItem}
                highestItem={mockHighestItem}
            />
        );

        const gridElement = container.querySelector('.grid-cols-3');
        expect(gridElement).toBeInTheDocument();
    });
});
