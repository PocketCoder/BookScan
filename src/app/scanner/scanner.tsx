"use client";

import { useSearchParams } from "next/navigation";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { PriceTable } from "@/components/price-table";
import { BookDetailsCard } from "@/components/book-details-card";
import { SummaryCard } from "@/components/summary-card";
import { Result } from "react-zxing";
import "./scanner.css";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import React, { useState, useEffect, useCallback } from "react";
import { ScraperResults } from "@/types";

export default function Scanner() {
  const searchParams = useSearchParams();
  const initialBarcode = searchParams.get("barcode");

  const [scannedBarcode, setScannedBarcode] = useState<string | null>(
    initialBarcode,
  );
  const [results, setResults] = useState<ScraperResults | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = useCallback((result: Result) => {
    if (result) {
      setScannedBarcode(result.getText());
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (scannedBarcode) {
        setLoading(true);
        setError(null);
        setResults(null);
        try {
          const response = await fetch(`/api/lookup?barcode=${scannedBarcode}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch data");
          }
          const data: ScraperResults = await response.json();
          setResults(data);
        } catch (err) {
          setError((err as Error).message || "An unknown error occurred");
          console.error("Error fetching data:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [scannedBarcode]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-4xl shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            Book Price Scanner
          </CardTitle>
          <CardDescription className="text-center">
            Scan a barcode or enter it manually to find book prices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results ? (
            <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-4">
              <Card className="w-full md:w-1/3 max-w-xs shadow-lg rounded-lg p-4 flex flex-col items-center justify-center">
                <div className="w-full aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                  <BarcodeScanner onResult={handleScan} paused={true} />
                </div>
                {loading && <p className="text-lg mt-2">Loading...</p>}
                {error && (
                  <p className="text-lg text-red-500 mt-2">Error: {error}</p>
                )}
              </Card>
              <div className="flex flex-col items-center space-y-4 w-full md:w-2/3">
                {results.bookDetails && (
                  <BookDetailsCard bookDetails={results.bookDetails} />
                )}
                {results.summary && (
                  <SummaryCard
                    minItem={results.summary.minItem}
                    averageItem={results.summary.averageItem}
                    highestItem={results.summary.highestItem}
                  />
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full mt-4">
                  <PriceTable
                    platform="ebay"
                    platformDisplay="eBay"
                    items={results.ebay.items}
                    barcode={scannedBarcode}
                  />
                  <PriceTable
                    platform="abebooks"
                    platformDisplay="AbeBooks"
                    items={results.abeBooks.items}
                    barcode={scannedBarcode}
                  />
                  <PriceTable
                    platform="amazon"
                    platformDisplay="Amazon"
                    items={results.amazon.items}
                    barcode={scannedBarcode}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-full max-w-md aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                <BarcodeScanner onResult={handleScan} />
              </div>
              {loading && <p className="text-lg">Loading...</p>}
              {error && <p className="text-lg text-red-500">Error: {error}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
