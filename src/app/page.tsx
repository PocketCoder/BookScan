"use client";

import { useRouter } from "next/navigation";
import { BarcodeScanner } from "@/components/barcode-scanner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function Home() {
  const router = useRouter();

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
          <div className="flex flex-col items-center space-y-4">
            <div className="w-full max-w-md aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
              <BarcodeScanner
                onResult={(result) => {
                  router.push(`/scanner?barcode=${result.getText()}`);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
