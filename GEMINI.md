# Project Overview

This is the BookCheck project, a Next.js application that allows users to scan book barcodes and get price information from eBay, AbeBooks, and World of Books.

The application is built with Next.js, React, and TypeScript. It uses the `react-qr-reader` library to scan barcodes, and then makes an API call to a backend endpoint that fetches price data from the following sources:

- **eBay**: Uses the `ebay-api` library to search for products by barcode.
- **AbeBooks**: Scrapes the AbeBooks website for prices using `axios` and `cheerio`.
- **World of Books**: Scrapes the World of Books website for prices using `axios` and `cheerio`.

The backend then returns the price information to the frontend, which displays it to the user.

# Building and Running

To build and run this project, you will need to have Node.js and pnpm installed.

1.  **Install dependencies:**

    ```bash
    pnpm install
    ```

2.  **Run the development server:**

    ```bash
    pnpm dev
    ```

    This will start the development server on [http://localhost:3000](http://localhost:3000).

3.  **Build for production:**

    ```bash
    pnpm build
    ```

4.  **Run in production mode:**

    ```bash
    pnpm start
    ```

# Development Conventions

## Linting

This project uses ESLint for linting. You can run the linter with the following command:

```bash
pnpm lint
```

## Environment Variables

The application requires the following environment variables to be set for the eBay API:

- `EBAY_APP_ID`: Your eBay application ID.
- `EBAY_CERT_ID`: Your eBay certificate ID.
- `EBAY_DEV_ID`: Your eBay developer ID.

These can be set in a `.env.local` file in the root of the project.
