import { useSearchParams } from 'next/navigation';
import { BarcodeScanner } from '@/components/barcode-scanner';
import { Result } from 'react-zxing'; // Import Result type
import './scanner.css';
import Image from 'next/image';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';



import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { BarcodeScanner } from '@/components/barcode-scanner';
import { Result } from 'react-zxing';
import './scanner.css';
import Image from 'next/image';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ItemData, ScraperResults } from '@/types';

export default function ScannerPage() {
  const searchParams = useSearchParams();
  const initialBarcode = searchParams.get('barcode');

  const [scannedBarcode, setScannedBarcode] = useState<string | null>(initialBarcode);
  const [results, setResults] = useState<ScraperResults | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = useCallback((result: Result) => {
    if (result) {
      setScannedBarcode(result.getText());
    }
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(price);
  };

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
            throw new Error(errorData.error || 'Failed to fetch data');
          }
          const data: ScraperResults = await response.json();
          setResults(data);
        } catch (err) {
          setError((err as Error).message || 'An unknown error occurred');
          console.error('Error fetching data:', err);
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
          <CardTitle className="text-3xl font-bold text-center">Book Price Scanner</CardTitle>
          <CardDescription className="text-center">Scan a barcode or enter it manually to find book prices.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <div className="w-full max-w-md aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
              <BarcodeScanner onResult={handleScan} />
            </div>
            {loading && <p className="text-lg">Loading...</p>}
            {error && <p className="text-lg text-red-500">Error: {error}</p>}
            {results && results.bookDetails && (
              <div className="flex flex-col items-center text-center mt-4">
                {results.bookDetails.coverImage && (
                  <Image
                    src={results.bookDetails.coverImage}
                    alt={results.bookDetails.title ? `Cover of ${results.bookDetails.title}` : 'Book Cover'}
                    width={128}
                    height={192}
                    className="mb-2 shadow-md"
                  />
                )}
                {results.bookDetails.title && <h2 className="text-2xl font-bold">{results.bookDetails.title}</h2>}
                {results.bookDetails.authors && (
                  <p className="text-gray-600 dark:text-gray-400">by {results.bookDetails.authors.join(', ')}</p>
                )}
                {results.bookDetails.format && (
                  <p className="text-gray-600 dark:text-gray-400">Format: {results.bookDetails.format}</p>
                )}
              </div>
            )}
            {results && results.summary && (
              <Card className="w-full mt-4">
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <p>
                    Minimum Price: <a href={results.summary.minItem.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {formatPrice(results.summary.minItem.price)}
                    </a>
                  </p>
                  <p>
                    Maximum Price: <a href={results.summary.maxItem.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {formatPrice(results.summary.maxItem.price)}
                    </a>
                  </p>
                  <p>
                    Highest Price: <a href={results.summary.highestItem.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {formatPrice(results.summary.highestItem.price)}
                    </a>
                  </p>
                </CardContent>
              </Card>
            )}
            {results && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>eBay</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results.ebay.items.length > 0 ? (
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
                          {results.ebay.items.map((item: ItemData, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{formatPrice(item.price)}</TableCell>
                              <TableCell>{item.quality || 'N/A'}</TableCell>
                              <TableCell>{item.format || 'N/A'}</TableCell>
                              <TableCell>
                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  View
                                </a>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p>No eBay items found.</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>AbeBooks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results.abeBooks.items.length > 0 ? (
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
                          {results.abeBooks.items.map((item: ItemData, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{formatPrice(item.price)}</TableCell>
                              <TableCell>{item.quality || 'N/A'}</TableCell>
                              <TableCell>{item.format || 'N/A'}</TableCell>
                              <TableCell>
                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  View
                                </a>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p>No AbeBooks items found.</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>World of Books</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results.worldOfBooks.items.length > 0 ? (
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
                          {results.worldOfBooks.items.map((item: ItemData, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{formatPrice(item.price)}</TableCell>
                              <TableCell>{item.quality || 'N/A'}</TableCell>
                              <TableCell>{item.format || 'N/A'}</TableCell>
                              <TableCell>
                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  View
                                </a>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p>No World of Books items found.</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Amazon</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results.amazon.items.length > 0 ? (
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
                          {results.amazon.items.map((item: ItemData, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{formatPrice(item.price)}</TableCell>
                              <TableCell>{item.quality || 'N/A'}</TableCell>
                              <TableCell>{item.format || 'N/A'}</TableCell>
                              <TableCell>
                                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  View
                                </a>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p>No Amazon items found.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
