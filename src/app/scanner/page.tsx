import { Suspense } from "react";
import Scanner from "./scanner";

export default function ScannerPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Scanner />
    </Suspense>
  );
}
