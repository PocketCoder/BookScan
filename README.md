# BookCheck 📚

A modern Next.js application that allows users to scan book barcodes and instantly compare prices from multiple online marketplaces.

## 🌟 Features

- **Barcode Scanning**: Real-time barcode scanning using device camera
- **Multi-Marketplace Price Comparison**: Fetch and compare prices from:
  - eBay
  - AbeBooks
  - World of Books
  - Amazon
- **Price Analytics**: View lowest, highest, and average prices across all sources
- **Mobile-First Design**: Optimized for mobile devices with responsive UI
- **Flash Toggle**: Camera flash control for low-light scanning
- **Book Information**: Detailed book metadata and condition information

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- pnpm (recommended package manager)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pricerr
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory with the following variables:

```env
EBAY_APP_ID=your_ebay_app_id
EBAY_CERT_ID=your_ebay_cert_id
EBAY_DEV_ID=your_ebay_dev_id
```

> **Note**: You'll need to register for eBay API credentials at [eBay Developers Program](https://developer.ebay.com/).

### Running the Application

#### Development Mode

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

#### Production Build

```bash
pnpm build
pnpm start
```

## 🧪 Testing

The project includes comprehensive test coverage with both unit and end-to-end tests.

### Unit Tests

Run Jest unit tests:
```bash
pnpm test
```

Watch mode for development:
```bash
pnpm test:watch
```

Generate coverage report:
```bash
pnpm test:coverage
```

### End-to-End Tests

Run Playwright E2E tests:
```bash
pnpm test:e2e
```

Run with UI mode:
```bash
pnpm test:e2e:ui
```

Debug mode:
```bash
pnpm test:e2e:debug
```

### Run All Tests

```bash
pnpm test:all
```

## 🏗️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Barcode Scanning**: [react-zxing](https://github.com/zxing-js/react-zxing)
- **API Integration**: 
  - [ebay-api](https://github.com/pajaydev/ebay-node-api) for eBay
  - [axios](https://axios-http.com/) & [cheerio](https://cheerio.js.org/) for web scraping
- **Testing**:
  - [Jest](https://jestjs.io/) for unit tests
  - [Playwright](https://playwright.dev/) for E2E tests
  - [React Testing Library](https://testing-library.com/react) for component tests
- **Code Quality**:
  - [ESLint](https://eslint.org/) for linting
  - [Prettier](https://prettier.io/) for code formatting
  - [Husky](https://typicode.github.io/husky/) & [lint-staged](https://github.com/okonet/lint-staged) for pre-commit hooks

## 📁 Project Structure

```
pricerr/
├── src/
│   ├── app/              # Next.js app router pages and API routes
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and libraries
│   ├── test-utils/      # Testing utilities
│   └── types.ts         # TypeScript type definitions
├── tests/               # E2E tests
├── __mocks__/           # Jest mocks
├── public/              # Static assets
└── [config files]       # Various configuration files
```

## 🔧 Development

### Code Quality

Lint your code:
```bash
pnpm lint
```

### Environment Variables

The following environment variables are required:

| Variable | Description | Required |
|----------|-------------|----------|
| `EBAY_APP_ID` | eBay Application ID | Yes |
| `EBAY_CERT_ID` | eBay Certificate ID | Yes |
| `EBAY_DEV_ID` | eBay Developer ID | Yes |

## 📱 Usage

1. **Open the application** in your mobile browser or desktop
2. **Grant camera permissions** when prompted
3. **Position a book barcode** in the camera view
4. **Wait for automatic detection** and price fetching
5. **View price comparisons** from multiple marketplaces
6. **Analyze pricing data** including lowest, highest, and average prices

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- All tests pass (`pnpm test:all`)
- Code is properly formatted (pre-commit hooks will handle this)
- New features include appropriate tests

## 📄 License

This project is private and proprietary.

## 🐛 Troubleshooting

### Camera Not Working

- Ensure your browser has permission to access the camera
- Try using HTTPS (required for camera access in most browsers)
- Check if your device camera is being used by another application

### API Rate Limits

- eBay API has rate limits; consider implementing caching for frequently scanned books
- Web scraping may be affected by changes to target websites

### Build Issues

If you encounter build issues:
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 📞 Support

For issues, questions, or suggestions, please open an issue in the repository.

---

Built with ❤️ using Next.js and React
