import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemData } from "@/types";
import { formatPrice } from "@/lib/format";

interface SummaryCardProps {
    minItem: ItemData;
    averageItem: ItemData | null;
    highestItem: ItemData;
}

/**
 * Component for displaying price summary (min, average, max)
 */
export const SummaryCard: React.FC<SummaryCardProps> = ({
    minItem,
    averageItem,
    highestItem,
}) => {
    return (
        <Card className="w-full mt-4">
            <CardHeader>
                <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
                {minItem && minItem.link && (
                    <p>
                        Lowest Price:{" "}
                        <a
                            href={minItem.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                        >
                            {formatPrice(minItem.price)}
                        </a>
                    </p>
                )}
                {averageItem && averageItem.link && (
                    <p>Average Price: {formatPrice(averageItem.price)}</p>
                )}
                {highestItem && highestItem.link && (
                    <p>
                        Highest Price:{" "}
                        <a
                            href={highestItem.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                        >
                            {formatPrice(highestItem.price)}
                        </a>
                    </p>
                )}
            </CardContent>
        </Card>
    );
};
