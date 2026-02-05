import React, { useState, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { View, Text, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { getWords, updateWordStats } from '../utils/storage';
import { evaluateSentence } from '../utils/gemini';

export default function Quiz() {
    const navigation = useNavigation();
    const [words, setWords] = useState([]);
    const [appState, setAppState] = useState('menu'); // menu, playing, feedback, finished
    const [gameMode, setGameMode] = useState(null); // 'written', 'mc_def', 'mc_word'
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [score, setScore] = useState(0);
    const [textInput, setTextInput] = useState('');
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [feedback, setFeedback] = useState(null); // { correct: bool, message: string }
    const [quizQueue, setQuizQueue] = useState([]);
    const [sessionTotal, setSessionTotal] = useState(0);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [streamedFeedback, setStreamedFeedback] = useState('');

    // Refresh count when screen comes into focus
    // Refresh count when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            console.log("Quiz screen focused, resetting state...");
            loadWords();
            setAppState('menu');
            setGameMode(null);
            setScore(0);
        }, [])
    );

    const loadWords = async () => {
        const loadedWords = await getWords();
        setWords(loadedWords);
    };

    const startGame = (selectedMode) => {
        if (words.length < 4 && (selectedMode === 'mc_def' || selectedMode === 'mc_word')) {
            Alert.alert("Not enough words", "You need at least 4 words specifically for Multiple Choice modes!");
            return;
        }
        if (words.length < 1) {
            Alert.alert("No words", "Please add some words first!");
            return;
        }
        Haptics.selectionAsync();

        // Shuffle words and initialize the queue
        const shuffled = [...words].sort(() => Math.random() - 0.5);
        setQuizQueue(shuffled);
        setSessionTotal(shuffled.length);

        setGameMode(selectedMode);
        setScore(0);
        setAppState('playing');
        setIsEvaluating(false);

        // Generate first question from the fresh shuffled list
        generateQuestion(selectedMode, shuffled);
    };

    const generateQuestion = (currentMode, queue = null) => {
        setFeedback(null);
        setTextInput('');
        setSelectedAnswer(null);

        // Determine which queue to use: the one passed in (for immediate first render) or the state
        let currentQueue = queue || quizQueue;

        if (currentQueue.length === 0) {
            setAppState('finished');
            return;
        }

        const target = currentQueue[0];
        // Update the queue for the next turn
        const nextQueue = currentQueue.slice(1);
        setQuizQueue(nextQueue);

        let questionData = { target };

        if (currentMode === 'mc_def' || currentMode === 'mc_word') {
            const otherWords = words.filter(w => w.id !== target.id);
            const shuffledOthers = otherWords.sort(() => Math.random() - 0.5);
            const distractors = shuffledOthers.slice(0, 3);

            // Shuffle options including target
            const options = [...distractors, target].sort(() => Math.random() - 0.5);
            questionData.options = options;
        }

        setCurrentQuestion(questionData);
    };

    const updateStats = async (wordId, isCorrect) => {
        const updatedWords = await updateWordStats(wordId, isCorrect);
        setWords(updatedWords);
    };

    const checkAnswer = async (answer) => {
        if (gameMode === 'sentence_builder') {
            setSelectedAnswer(answer);
            setIsEvaluating(true);
            setStreamedFeedback('');

            // Temporary state to show feedback area immediately while streaming
            setAppState('feedback');
            setFeedback({ correct: null, message: '' }); // message will be streamed

            const handleStreamUpdate = (chunk) => {
                setStreamedFeedback(prev => prev + chunk);
            };

            const handleVerdictUpdate = (isCorrect) => {
                setFeedback(prev => ({ ...prev, correct: isCorrect }));
                if (isCorrect) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } else {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                }
            };

            const result = await evaluateSentence(
                currentQuestion.target.word,
                currentQuestion.target.definition,
                answer,
                handleStreamUpdate,
                handleVerdictUpdate
            );

            setIsEvaluating(false);

            // Finalize state with the result
            if (result.isCorrect) {
                setScore(score + 1);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
            updateStats(currentQuestion.target.id, result.isCorrect);

            setFeedback({
                correct: result.isCorrect,
                message: result.isCorrect ? 'Correct!' : 'Try Again!'
            });
            return;
        }

        // Standard logic for other modes
        setSelectedAnswer(answer);
        const isCorrect =
            gameMode === 'written'
                ? answer.trim().toLowerCase() === currentQuestion.target.word.toLowerCase()
                : answer.id === currentQuestion.target.id;

        const feedbackMsg = isCorrect ? 'Correct!' : `Wrong! It was "${currentQuestion.target.word}"`;

        if (isCorrect) {
            setScore(score + 1);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        updateStats(currentQuestion.target.id, isCorrect);

        setFeedback({
            correct: isCorrect,
            message: feedbackMsg
        });
        setAppState('feedback');
    };

    const nextQuestion = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setAppState('playing');
        setStreamedFeedback('');
        generateQuestion(gameMode); // Uses quizQueue from state
    };

    return (
        <View className="flex-1 bg-white dark:bg-gray-900">
            {appState === 'menu' && (
                <View className="flex-1 justify-center items-center p-6">
                    <View className="w-full max-w-md relative">
                        <View className="absolute bottom-full left-0 right-0 mb-12">
                            <Text className="text-gray-900 dark:text-white text-3xl font-bold text-center">Select Quiz Mode</Text>
                        </View>

                        <TouchableOpacity
                            className="bg-emerald-600 p-5 rounded-xl mb-6 shadow-lg shadow-emerald-900/50 w-full"
                            onPress={() => startGame('mc_def')}
                        >
                            <Text className="text-white text-2xl font-bold text-center">Pick the Word (Easy)</Text>
                            <View className="flex-row items-center mt-1 w-full">
                                <View className="flex-1 items-end pr-2">
                                    <Text className="text-emerald-100 text-base italic" numberOfLines={1} adjustsFontSizeToFit>Meaning provided</Text>
                                </View>
                                <Feather name="arrow-right" size={16} color="#d1fae5" />
                                <View className="flex-1 items-start pl-2">
                                    <Text className="text-emerald-100 text-base italic" numberOfLines={1} adjustsFontSizeToFit>Choose Word</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="bg-yellow-500 p-5 rounded-xl mb-6 shadow-lg shadow-yellow-900/50 w-full"
                            onPress={() => startGame('mc_word')}
                        >
                            <Text className="text-white text-2xl font-bold text-center">Pick the Definition (Medium)</Text>
                            <View className="flex-row items-center mt-1 w-full">
                                <View className="flex-1 items-end pr-2">
                                    <Text className="text-white text-base italic" numberOfLines={1} adjustsFontSizeToFit>Word provided</Text>
                                </View>
                                <Feather name="arrow-right" size={16} color="white" />
                                <View className="flex-1 items-start pl-2">
                                    <Text className="text-white text-base italic" numberOfLines={1} adjustsFontSizeToFit>Choose Meaning</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="bg-rose-600 p-5 rounded-xl mb-6 shadow-lg shadow-rose-900/50 w-full"
                            onPress={() => startGame('written')}
                        >
                            <Text className="text-white text-2xl font-bold text-center">Written (Hard)</Text>
                            <Text className="text-rose-100 text-center text-base italic mt-1">Type the word from definition</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="bg-violet-600 p-5 rounded-xl mb-6 shadow-lg shadow-violet-900/50 w-full"
                            onPress={() => startGame('sentence_builder')}
                        >
                            <Text className="text-white text-2xl font-bold text-center">Use it in a Sentence</Text>
                            <Text className="text-violet-100 text-center text-base italic mt-1">AI rates your usage</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {appState === 'finished' && (
                <View className="flex-1 justify-center items-center p-6">
                    <View className="w-full max-w-md items-center" style={{ marginTop: -80 }}>
                        <Text className="text-gray-900 dark:text-white text-4xl font-bold mb-4 text-center">Quiz Complete!</Text>
                        <Text className="text-gray-600 dark:text-gray-300 text-xl mb-8 text-center">
                            You scored <Text className="text-green-600 dark:text-green-400 font-bold">{score}</Text> out of <Text className="font-bold">{sessionTotal}</Text>
                        </Text>
                        <TouchableOpacity className="bg-blue-600 px-8 py-3 rounded-xl" onPress={() => {
                            console.log("Back to Menu pressed");
                            setAppState('menu');
                            setGameMode(null);
                        }}>
                            <Text className="text-white text-xl font-bold">Back to Menu</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {(appState === 'playing' || appState === 'feedback') && (
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-white dark:bg-gray-900 p-6">
                    <View className="flex-row justify-between mb-8 mt-4">
                        <Text className="text-gray-500 dark:text-gray-400">Score: {score}</Text>
                        <TouchableOpacity onPress={() => {
                            setAppState('menu');
                            setGameMode(null);
                            navigation.goBack();
                        }}>
                            <Text className="text-red-400">Exit</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Display Question Prompt */}
                    <View className="mb-6">
                        <Text className="text-gray-600 dark:text-gray-400 text-lg mb-2 text-center">
                            {gameMode === 'mc_word' ? 'What is the definition of:' :
                                gameMode === 'sentence_builder' ? 'Use this word in a sentence:' : 'What word matches this definition?'}
                        </Text>

                        {gameMode === 'sentence_builder' && (
                            <View className="mb-4">
                                <Text className="text-gray-900 dark:text-white text-3xl font-bold text-center mb-2">{currentQuestion.target.word}</Text>
                                <Text className="text-gray-600 dark:text-gray-300 text-lg text-center italic">"{currentQuestion.target.definition}"</Text>
                            </View>
                        )}

                        {gameMode !== 'sentence_builder' && (
                            <Text className="text-gray-900 dark:text-white text-3xl font-bold text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
                                {gameMode === 'mc_word' ? currentQuestion.target.word : currentQuestion.target.definition}
                            </Text>
                        )}
                    </View>

                    {/* Input Area */}
                    {gameMode === 'written' || gameMode === 'sentence_builder' ? (
                        <View>
                            <TextInput
                                className={`bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-xl mb-6 text-xl border border-gray-200 dark:border-gray-700 ${gameMode === 'sentence_builder' ? 'text-left h-32' : 'text-center'}`}
                                placeholder={gameMode === 'sentence_builder' ? "Type your sentence here..." : "Type the word..."}
                                placeholderTextColor="#6b7280"
                                value={textInput}
                                onChangeText={setTextInput}
                                editable={appState === 'playing' && !isEvaluating}
                                autoCapitalize={gameMode === 'sentence_builder' ? "sentences" : "none"}
                                multiline={gameMode === 'sentence_builder'}
                                textAlignVertical={gameMode === 'sentence_builder' ? 'top' : 'center'}
                            />
                        </View>
                    ) : (
                        <View>
                            {currentQuestion.options.map((option, index) => (
                                <TouchableOpacity
                                    key={index}
                                    disabled={appState !== 'playing'}
                                    className={`p-4 rounded-xl mb-3 border ${appState === 'feedback'
                                        ? (option.id === currentQuestion.target.id ? 'bg-green-600 border-green-600' : (option.id === selectedAnswer?.id ? 'bg-red-600 border-red-600' : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'))
                                        : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 active:bg-blue-100 dark:active:bg-blue-900'
                                        }`}
                                    onPress={() => checkAnswer(option)}
                                >
                                    <Text className={`text-lg ${appState === 'feedback' && (option.id === currentQuestion.target.id || option.id === selectedAnswer?.id) ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                        {gameMode === 'mc_word' ? option.definition : option.word}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Feedback Area */}
                    {appState === 'feedback' && feedback && (
                        <View>
                            {feedback.correct !== null && (
                                <View className=" items-center w-full">
                                    {/* Verdict Header */}
                                    <Text className={`text-2xl font-bold mb-2 ${feedback.correct ? 'text-green-500' : 'text-red-500'}`}>
                                        {feedback.correct ? 'Correct!' : 'Needs Improvement'}
                                    </Text>

                                    {/* Main Feedback Content (Streamed or Static) */}
                                    <Text className="text-gray-900 dark:text-white text-lg mb-6 text-center leading-relaxed">
                                        {gameMode === 'sentence_builder' ? streamedFeedback : feedback.message}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Persistent Action Button */}
                    <TouchableOpacity
                        className={`px-8 py-4 rounded-xl w-full ${isEvaluating ? 'bg-gray-700' : 'bg-blue-600'} mt-4`}
                        onPress={() => {
                            if (appState === 'playing') {
                                !isEvaluating && checkAnswer(gameMode === 'sentence_builder' || gameMode === 'written' ? textInput : selectedAnswer);
                            } else {
                                nextQuestion();
                            }
                        }}
                        disabled={isEvaluating}
                    >
                        {isEvaluating ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <Text className="text-white text-xl font-bold text-center">
                                {appState === 'playing' ? "Submit" : (quizQueue.length === 0 ? "Finish" : "Next Question")}
                            </Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            )}
        </View>
    );
}
