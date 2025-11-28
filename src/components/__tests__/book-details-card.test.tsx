import React from 'react';
import { render, screen } from '@testing-library/react';
import { BookDetailsCard } from '../book-details-card';
import { BookDetails } from '@/types';

// Mock Next.js Image component
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => {
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        return <img {...props} />;
    },
}));

describe('BookDetailsCard', () => {
    const completeBookDetails: BookDetails = {
        title: 'Harry Potter and the Philosopher\'s Stone',
        authors: ['J.K. Rowling'],
        coverImage: 'https://example.com/cover.jpg',
        format: 'Paperback',
    };

    it('should render all book details when provided', () => {
        render(<BookDetailsCard bookDetails={completeBookDetails} />);

        expect(screen.getByText('Harry Potter and the Philosopher\'s Stone')).toBeInTheDocument();
        expect(screen.getByText('by J.K. Rowling')).toBeInTheDocument();
        expect(screen.getByText('Format: Paperback')).toBeInTheDocument();
    });

    it('should render cover image when provided', () => {
        render(<BookDetailsCard bookDetails={completeBookDetails} />);

        const image = screen.getByAltText('Cover of Harry Potter and the Philosopher\'s Stone');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', 'https://example.com/cover.jpg');
    });

    it('should use generic alt text when title is not provided', () => {
        const detailsWithoutTitle: BookDetails = {
            coverImage: 'https://example.com/cover.jpg',
        };

        render(<BookDetailsCard bookDetails={detailsWithoutTitle} />);

        const image = screen.getByAltText('Book Cover');
        expect(image).toBeInTheDocument();
    });

    it('should handle multiple authors', () => {
        const detailsWithMultipleAuthors: BookDetails = {
            title: 'Good Omens',
            authors: ['Terry Pratchett', 'Neil Gaiman'],
        };

        render(<BookDetailsCard bookDetails={detailsWithMultipleAuthors} />);

        expect(screen.getByText('by Terry Pratchett, Neil Gaiman')).toBeInTheDocument();
    });

    it('should not render title when missing', () => {
        const detailsWithoutTitle: BookDetails = {
            authors: ['J.K. Rowling'],
        };

        render(<BookDetailsCard bookDetails={detailsWithoutTitle} />);

        expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    });

    it('should not render authors when missing', () => {
        const detailsWithoutAuthors: BookDetails = {
            title: 'Some Book',
        };

        render(<BookDetailsCard bookDetails={detailsWithoutAuthors} />);

        expect(screen.queryByText(/^by /)).not.toBeInTheDocument();
    });

    it('should not render format when missing', () => {
        const detailsWithoutFormat: BookDetails = {
            title: 'Some Book',
        };

        render(<BookDetailsCard bookDetails={detailsWithoutFormat} />);

        expect(screen.queryByText(/^Format: /)).not.toBeInTheDocument();
    });

    it('should not render cover image when missing', () => {
        const detailsWithoutCover: BookDetails = {
            title: 'Some Book',
            authors: ['Author Name'],
        };

        render(<BookDetailsCard bookDetails={detailsWithoutCover} />);

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('should handle empty book details object', () => {
        const emptyDetails: BookDetails = {};

        render(<BookDetailsCard bookDetails={emptyDetails} />);

        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
});
