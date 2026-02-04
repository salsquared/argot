# Project Setup Guide

## Prerequisites

- Node.js (Latest LTS recommended)
- npm or yarn
- Expo CLI (optional, can use `npx expo`)
- Mobile device with Expo Go, or verify Android/iOS Emulator setup.

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd argot
    ```

2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

## Running the App

To start the development server:

```bash
npx expo start
```

- Press `a` to open in Android Emulator.
- Press `i` to open in iOS Simulator (macOS only).
- Scan the QR code with Expo Go on your physical device.

## Environment Variables

Create a `.env` file in the root directory. You will need keys for both Google Gemini (for AI features) and Merriam-Webster (as a backup dictionary source).

```env
GEMINI_API_KEY=your_gemini_key_here
MERRIAM_WEBSTER_KEY=your_mw_key_here
```

- **Gemini API**: Visit [Google AI Studio](https://aistudio.google.com/).
- **Merriam-Webster**: Register at [DictionaryAPI.com](https://dictionaryapi.com/) for a "Collegiate Dictionary" key (free).
