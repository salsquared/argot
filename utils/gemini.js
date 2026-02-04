import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "@env";

let genAI = null;
let modelInstance = null;
const MODEL_NAME = "gemini-3-flash-preview";

const initializeGemini = () => {
    const apiKey = GEMINI_API_KEY;
    console.log("[Gemini] API Key loaded:", apiKey ? "Yes (Ends with " + apiKey.slice(-4) + ")" : "No");
    if (!apiKey) {
        console.warn("GEMINI_API_KEY is missing in .env");
        return false;
    }
    if (!genAI) {
        genAI = new GoogleGenerativeAI(apiKey);
        modelInstance = genAI.getGenerativeModel({ model: MODEL_NAME });
    }
    return true;
};

export const evaluateSentence = async (word, definition, userSentence, onFeedbackStream, onVerdict) => {
    if (!initializeGemini()) {
        onVerdict && onVerdict(false);
        onFeedbackStream && onFeedbackStream("API Key missing.");
        return {
            isCorrect: false,
            feedback: "API Key missing. Please set GEMINI_API_KEY in your .env file."
        };
    }

    const prompt = `
        You are an English language tutor helpfully correcting a student.
        The student uses the word "${word}" (definition: "${definition}") in a sentence.
        
        Student's sentence: "${userSentence}"
        
        Evaluate if the student used the word correctly.
        
        Respond using this EXACT format:
        VERDICT: [CORRECT or INCORRECT]
        FEEDBACK: [Your brief explanation here]
    `;

    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        try {
            // Use non-streaming method to avoid React Native fetch stream issues
            const result = await modelInstance.generateContent(prompt);
            const responseText = result.response.text();

            let verdict = null;
            let isCorrect = false;
            let feedbackText = responseText;

            // Parse Verdict
            const verdictMatch = responseText.match(/VERDICT:\s*(CORRECT|INCORRECT)/i);
            if (verdictMatch) {
                verdict = verdictMatch[1].toUpperCase();
                isCorrect = verdict === 'CORRECT';
                if (onVerdict) onVerdict(isCorrect);
            } else {
                // Fallback if no verdict found
                if (onVerdict) onVerdict(false);
            }

            // Parse Feedback
            const feedbackMatch = responseText.match(/FEEDBACK:([\s\S]*)/i);
            if (feedbackMatch) {
                feedbackText = feedbackMatch[1].trim();
            }

            // Simulate Streaming for visual effect
            if (onFeedbackStream) {
                const chunkSize = 5; // chars per chunk
                for (let i = 0; i < feedbackText.length; i += chunkSize) {
                    const chunk = feedbackText.slice(i, i + chunkSize);
                    onFeedbackStream(chunk);
                    // Artificial delay to simulate typing
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }

            return {
                isCorrect: isCorrect,
                feedback: feedbackText
            };

        } catch (error) {
            console.error(`Gemini API Error (Attempt ${attempt + 1}/${MAX_RETRIES}):`, error);

            const errorMessage = error.message || String(error);
            const isServiceError = errorMessage.includes("503") || errorMessage.includes("Overloaded") || errorMessage.includes("The model is overloaded");

            if (isServiceError && attempt < MAX_RETRIES - 1) {
                attempt++;
                const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s...
                console.log(`Retrying in ${delayMs}ms...`);

                if (onFeedbackStream) {
                    onFeedbackStream(` ... (Server busy, retrying in ${delayMs / 1000}s) ... `);
                }

                await new Promise(resolve => setTimeout(resolve, delayMs));
                continue; // Retry loop
            }

            // If we're here, it's a fatal error or retries exhausted
            if (onVerdict) onVerdict(false); // Ensure callback receives a value

            return {
                isCorrect: false,
                feedback: "Sorry, I couldn't evaluate that right now due to high server traffic (503). Please try again in a moment."
            };
        }
    }
};
