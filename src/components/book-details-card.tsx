import React from "react";
import Image from "next/image";
import { BookDetails } from "@/types";

interface BookDetailsCardProps {
    bookDetails: BookDetails;
}

/**
 * Component for displaying book details including cover, title, authors, and format
 */
export const BookDetailsCard: React.FC<BookDetailsCardProps> = ({
    bookDetails,
}) => {
    return (
        <div className="flex flex-col items-center text-center mt-4">
            {bookDetails.coverImage && (
                <Image
                    src={bookDetails.coverImage}
                    alt={
                        bookDetails.title ? `Cover of ${bookDetails.title}` : "Book Cover"
                    }
                    width={128}
                    height={192}
                    className="mb-2 shadow-md"
                />
            )}
            {bookDetails.title && (
                <h2 className="text-2xl font-bold">{bookDetails.title}</h2>
            )}
            {bookDetails.authors && (
                <p className="text-gray-600 dark:text-gray-400">
                    by {bookDetails.authors.join(", ")}
                </p>
            )}
            {bookDetails.format && (
                <p className="text-gray-600 dark:text-gray-400">
                    Format: {bookDetails.format}
                </p>
            )}
        </div>
    );
};
