# Argot

Argot is a premium, offline-first vocabulary learning application designed to help users expand their lexicon with style. Built with React Native and Expo, and styled with NativeWind, it offers a sleek, dark-mode-first experience.

## Features

- **📚 Vocab Builder**: Easily add new words and definitions to your personal library.
- **🧠 Interactive Quizzes**: Challenge yourself with various quiz modes to test your retention.
- **🤖 AI Integration**: Receive instant feedback on your sentence usage with Google Gemini.
- **🗂️ Word List**: Browse and review your collected words in a clean, organized interface.
- **✨ Premium UI**: A polished dark-themed design using Tailwind CSS for a modern aesthetic.
- **💾 Persistence**: Data is saved locally using Async Storage, ensuring your words are always with you.
- **📳 Haptic Feedback**: Tactile responses for interactions using Expo Haptics.
- **🌍 Multi-Language Support**: Built-in support for diverse languages with flag indicators.
  > **Note**: Full multilingual support is currently in development. The application is fully functional for English vocabulary.

## Data Sources

The application utilizes a multi-tiered dictionary system to ensure broad coverage:

### 1. Primary Source: [Free Dictionary API](https://dictionaryapi.dev/)
- **Usage**: First-line lookup for definitions, part-of-speech tags, and phonetics.
- **Coverage**: Standard English vocabulary.

### 2. Secondary/Fallback Source: [Merriam-Webster's Collegiate Dictionary API](https://dictionaryapi.com/)
- **Usage**: Automatically used when the primary source fails to find a word (e.g., specific terms, some expletives like "Hell").
- **Coverage**: Trustworthy, academic standard for English, including culturally significant terms.
- **License**: Used under the non-commercial license (free tier).

### Future Integrations (Planned)

To further enhance the dictionary, the following are being evaluated:

1.  **Urban Dictionary (Unofficial API)**
    -   **Role**: To verify slang and colloquialisms when standard dictionaries fail.
2.  **Wiktionary**
    -   **Role**: For technical coverage and community-sourced definitions.




## Part of Speech Color Legend

| Type | Color |
| :--- | :--- |
| **Noun** | 🔵 Blue |
| **Verb** | 🟢 Green |
| **Adjective** | 🟠 Orange |
| **Adverb** | 🔵 Cyan |
| **Pronoun** | 🩷 Pink |
| **Preposition** | 🧼 Teal |
| **Conjunction** | 🟣 Indigo |
| **Interjection/Exclamation** | 🟡 Yellow |
| **Determiner/Article** | ⚫ Gray |
| **Names (Bio/Geo)** | 🪻 Purple |
| **Idioms/Phrases** | 🍋 Lime |
| **Affixes (Prefix/Suffix)** | ☁️ Sky |
| **Abbreviation/Symbol** | 🗿 Slate |
| **Other** | 🔴 Rose |

## Tech Stack

- **Core**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **AI**: [Google Gemini](https://ai.google.dev/)
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS)
- **Navigation**: [React Navigation](https://reactnavigation.org/)
- **Storage**: Async Storage

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- [Expo Go](https://expo.dev/client) app installed on your physical device, or an Android Emulator/iOS Simulator.

### Installation

1. **Clone the repository** (or navigate to the directory):
   ```bash
   cd Argot
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   *Note: This will install all necessary packages including Expo, NativeWind, and React Navigation.*

3. **Start the server**:
   ```bash
   npx expo start
   ```

4. **Setup Environment Variables**:
   Create a `.env` file in the root directory and add your keys:
   ```env
   GEMINI_API_KEY=your_gemini_key_here
   MERRIAM_WEBSTER_KEY=your_mw_key_here
   ```
   - Get a Gemini key from [Google AI Studio](https://aistudio.google.com/).
   - Get a Merriam-Webster Collegiate Dictionary key from [DictionaryAPI.com](https://dictionaryapi.com/).

### Usage

- **Run on Device**: Scan the QR code shown in the terminal with the Expo Go app (Android) or Camera app (iOS).
- **Run on Emulator**: Press `a` (Android) or `i` (iOS) in the terminal after starting the server.

## Project Structure

- `App.js`: Main entry point and navigation setup.
- `screens/`: Contains the main application screens:
  - `Home.js`: Dashboard and main menu.
  - `AddWord.js`: Interface for inputting new vocabulary.
  - `List.js`: Display of all saved words.
  - `Quiz.js`: Game logic for testing vocabulary.
- `components/`: Reusable UI components (e.g., `CustomModal.js`).
- `utils/`: Helper functions and configuration.
  - `config.js`: Application configuration (Dev/User mode).
  - `languages.js`: Language definitions and flags.
  - `posStyles.js`: Logic for Part-of-Speech color coding.
  - `dictionarySource.js`: Dictionary API integration logic.
- `scripts/`: Maintenance and testing scripts.
  - `collect_pos_types.js`: Scans dictionaries to validate POS coverage.
  - `test_dictionary_implementation.js`: Tests API connectivity.
- `assets/`: Images and static resources.

## Configuration & Modes

The application features a configurable mode system managed via `utils/config.js`.

### Dev Mode vs. User Mode

You can toggle between Development and User modes by changing the `IS_DEV` constant in `utils/config.js`:

```javascript
export const IS_DEV = true; // Set to 'false' for production/user mode
```

- **User Mode (`IS_DEV = false`)**: The standard experience for end-users. Clean interface focused on learning.
- **Dev Mode (`IS_DEV = true`)**: Enables additional maintenance tools. Currently, this includes:
  - **Refresh Metadata**: A button in the `List` view that triggers a data migration script. This script formats existing words (Title Case) and attempts to fetch missing Part of Speech (POS) tags from the dictionary API for any words that lack them.

## License

This project is open source and available under the [MIT License](LICENSE).
