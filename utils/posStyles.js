/**
 * Returns the Tailwind classes for a given Part of Speech (POS).
 * Handles variations from different dictionary sources (FreeDict, Merriam-Webster).
 * 
 * @param {string} pos - The part of speech string (e.g., "noun", "verb", "transitive verb")
 * @returns {string} Tailwind class string for background, text color, and border.
 */
export const getPosStyle = (pos) => {
    if (!pos) return 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600';

    const p = pos.toLowerCase().trim();

    // Helper for exact matches or reliable prefixes
    const is = (type) => p === type;
    const starts = (prefix) => p.startsWith(prefix + ' ');

    // --- PRIORITIZED SPECIFIC TYPES ---

    // Abbreviations & Symbols
    if (p.includes('abbreviation') || p.includes('symbol')) {
        return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500';
    }

    // Names (Biographical, Geographical)
    if (p.includes('biographical') || p.includes('geographical') || p.includes('name')) {
        return 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-600/20 dark:text-purple-200 dark:border-purple-500/30';
    }

    // Idioms & Phrases
    if (p.includes('idiom') || p.includes('phrase')) {
        return 'bg-lime-100 text-lime-700 border-lime-300 dark:bg-lime-500/20 dark:text-lime-200 dark:border-lime-500/30';
    }

    // Prefixes, Suffixes, Combining forms
    if (p.includes('prefix') || p.includes('suffix') || p.includes('combining')) {
        return 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-500/30';
    }

    // --- STANDARD PARTS OF SPEECH ---

    // Adverb (Check before verb to avoid overlap)
    if (is('adverb') || is('adv') || starts('adverb')) {
        return 'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-500/30';
    }

    // Verb
    if (is('verb') || is('v') || is('vt') || is('vi') || p.includes('verb')) {
        // Note: 'includes' is safe here because 'adverb' was already caught above.
        // We want to catch "transitive verb", "intransitive verb" etc.
        return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-500/30';
    }

    // Noun
    if (is('noun') || is('n') || p.includes('noun')) {
        return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-500/30';
    }

    // Adjective
    if (is('adjective') || is('adj') || p.includes('adjective')) {
        return 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-500/30';
    }

    // Pronoun
    if (is('pronoun') || is('pron') || p.includes('pronoun')) {
        return 'bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-900/40 dark:text-pink-300 dark:border-pink-500/30';
    }

    // Preposition
    if (is('preposition') || is('prep') || p.includes('preposition')) {
        return 'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-500/30';
    }

    // Conjunction
    if (is('conjunction') || is('conj') || p.includes('conjunction')) {
        return 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-500/30';
    }

    // Interjection/Exclamation
    if (p.includes('interjection') || p.includes('exclamation') || is('interj')) {
        return 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-500/30';
    }

    // Determiner/Article
    if (p.includes('determiner') || p.includes('article')) {
        return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500';
    }

    // Fallback for everything else
    return 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-500/30';
};
