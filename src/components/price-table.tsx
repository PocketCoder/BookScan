import React from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ItemData } from "@/types";
import { formatPrice, generateSearchUrl } from "@/lib/format";

interface PriceTableProps {
    platform: string;
    platformDisplay: string;
    items: ItemData[];
    barcode: string | null;
}

/**
 * Reusable component for displaying price comparison tables across different platforms
 */
export const PriceTable: React.FC<PriceTableProps> = React.memo(({
    platform,
    platformDisplay,
    items,
    barcode,
}) => {
    return (
        <Card>
            <CardHeader className="flex flex-wrap items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-2xl font-bold text-wrap">
                    {platformDisplay}
                </CardTitle>
                {barcode && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            window.open(generateSearchUrl(platform, barcode), "_blank")
                        }
                    >
                        Search {platformDisplay}
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {items.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Price</TableHead>
                                <TableHead>Condition</TableHead>
                                <TableHead>Format</TableHead>
                                <TableHead>Link</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item: ItemData, index: number) => (
                                <TableRow key={index}>
                                    <TableCell className="whitespace-normal">
                                        {formatPrice(item.price)}
                                    </TableCell>
                                    <TableCell>{item.quality || "N/A"}</TableCell>
                                    <TableCell>{item.format || "N/A"}</TableCell>
                                    <TableCell>
                                        <a
                                            href={item.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            View
                                        </a>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p>No {platformDisplay} items found.</p>
                )}
            </CardContent>
        </Card>
    );
});

PriceTable.displayName = "PriceTable";
