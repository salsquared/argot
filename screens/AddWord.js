import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Modal, FlatList } from 'react-native';
import { LANGUAGES } from '../utils/languages';

import * as Haptics from 'expo-haptics';
import { addWord } from '../utils/storage';
import SuccessModal from '../components/SuccessModal';
import ErrorModal from '../components/ErrorModal';
import { fetchWordDefinition } from '../utils/dictionarySource';
import { getPosStyle } from '../utils/posStyles';

export default function AddWord({ navigation }) {
    const [word, setWord] = useState('');
    const [definition, setDefinition] = useState('');
    const [partOfSpeech, setPartOfSpeech] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('EN');
    const [showLangModal, setShowLangModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // New state for definition selection
    const [availableDefinitions, setAvailableDefinitions] = useState([]);
    const [showDefinitionModal, setShowDefinitionModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [lookupError, setLookupError] = useState(null);

    const filteredLanguages = useMemo(() => {
        return LANGUAGES.filter(lang =>
            lang.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lang.value.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    // Debounce effect to fetch definition
    useEffect(() => {
        const trimmedWord = word.trim();
        const controller = new AbortController();
        const signal = controller.signal;

        if (trimmedWord.length === 0) {
            setDefinition('');
            setPartOfSpeech('');
            setAvailableDefinitions([]);
            setLookupError(null);
            return;
        }

        const fetchDefinition = async () => {
            if (trimmedWord.length < 2 || selectedLanguage !== 'EN') return;

            setIsLoading(true);
            setLookupError(null);
            setAvailableDefinitions([]);
            try {
                const result = await fetchWordDefinition(trimmedWord, signal);

                if (result && result.data && result.data.length > 0) {
                    setAvailableDefinitions(result.data);

                    // Auto-select the first definition
                    setDefinition(result.data[0].definition);
                    setPartOfSpeech(result.data[0].partOfSpeech);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } else {
                    setLookupError("Word not found");
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log("Fetch aborted");
                    return;
                }

                if (error.message === 'Word not found in any source') {
                    setLookupError("Word not found");
                } else {
                    console.log("Error fetching definition:", error);
                    setLookupError("Network error");
                }
            } finally {
                if (!signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        const timeoutId = setTimeout(() => {
            if (trimmedWord.length >= 2) fetchDefinition();
        }, 1000); // 1 second debounce

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [word, selectedLanguage]);

    const saveWord = async () => {
        if (!word.trim() || !definition.trim()) {
            Alert.alert('Error', 'Please enter both a word and a definition.');
            return;
        }

        try {
            // Auto-format word: First letter capital, rest lowercase
            const formattedWord = word.trim().charAt(0).toUpperCase() + word.trim().slice(1).toLowerCase();

            const newEntry = {
                id: Date.now().toString(),
                word: formattedWord,
                definition: definition.trim(),
                partOfSpeech: partOfSpeech,

                language: selectedLanguage,
                dateAdded: new Date().toISOString(),
            };

            const result = await addWord(newEntry);

            if (result.error === 'duplicate') {
                setShowDuplicateModal(true);
                return;
            }

            if (!result.success) {
                throw new Error("Failed to save");
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowSuccessModal(true);

        } catch (e) {
            Alert.alert('Error', 'Failed to save word.');
            console.error(e);
        }
    };

    const formContent = (
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-start', padding: 24 }} keyboardShouldPersistTaps="handled">
            <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-900 dark:text-white text-lg font-bold">Word</Text>
                <TouchableOpacity
                    onPress={() => setShowLangModal(true)}
                    className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600 flex-row items-center"
                >
                    <Text className="text-gray-900 dark:text-white font-bold mr-1">
                        {LANGUAGES.find(l => l.value === selectedLanguage)?.flag} {selectedLanguage}
                    </Text>
                </TouchableOpacity>
            </View>
            <View className="relative">
                <TextInput
                    className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-xl mb-6 text-lg border border-gray-200 dark:border-gray-700 focus:border-blue-500"
                    placeholder="e.g. Ephemeral"
                    placeholderTextColor="#6b7280"
                    value={word}
                    onChangeText={setWord}
                />
                {isLoading && (
                    <View className="absolute right-4 top-4">
                        <ActivityIndicator size="small" color="#3b82f6" />
                    </View>
                )}
            </View>

            <View className="flex-row justify-between mb-2">
                <Text className="text-gray-900 dark:text-white text-lg font-bold">Definition</Text>
                {isLoading ? (
                    <Text className="text-blue-400 text-sm italic">Searching...</Text>
                ) : availableDefinitions.length > 1 ? (
                    <TouchableOpacity onPress={() => setShowDefinitionModal(true)}>
                        <Text className="text-blue-400 text-sm font-bold">Show all {availableDefinitions.length} definitions</Text>
                    </TouchableOpacity>
                ) : lookupError ? (
                    <Text className="text-red-400 text-sm italic">{lookupError}</Text>
                ) : null}
            </View>

            <TextInput
                className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-xl mb-8 text-lg border border-gray-200 dark:border-gray-700 h-32 focus:border-blue-500"
                placeholder="Type logic manually or wait for auto-fetch..."
                placeholderTextColor="#6b7280"
                multiline
                textAlignVertical="top"
                value={definition}
                onChangeText={setDefinition}
            />

            <TouchableOpacity
                className={`p-4 rounded-xl items-center ${(!word.trim() || !definition.trim()) ? 'bg-gray-700' : 'bg-blue-600'}`}
                onPress={saveWord}
                disabled={!word.trim() || !definition.trim()}
            >
                <Text className="text-white font-bold text-lg">Add to List</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    return (
        <>
            {Platform.OS === 'ios' ? (
                <KeyboardAvoidingView
                    behavior="padding"
                    className="flex-1 bg-white dark:bg-gray-900"
                >
                    {formContent}
                </KeyboardAvoidingView>
            ) : (
                <View className="flex-1 bg-white dark:bg-gray-900">
                    {formContent}
                </View>
            )}

            <Modal
                visible={showLangModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowLangModal(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white dark:bg-gray-900 rounded-t-3xl p-6 h-2/3">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-gray-900 dark:text-white text-xl font-bold">Select Language</Text>
                            <TouchableOpacity onPress={() => setShowLangModal(false)}>
                                <Text className="text-blue-400 text-lg">Done</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-xl mb-4 text-base border border-gray-200 dark:border-gray-700"
                            placeholder="Search language..."
                            placeholderTextColor="#6b7280"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />

                        <FlatList
                            data={filteredLanguages}
                            keyExtractor={item => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className={`p-4 mb-2 rounded-xl flex-row items-center justify-between ${selectedLanguage === item.value ? 'bg-gray-100 dark:bg-gray-800 border border-blue-500' : 'bg-gray-100 dark:bg-gray-800'}`}
                                    onPress={() => {
                                        setSelectedLanguage(item.value);
                                        setShowLangModal(false);
                                    }}
                                >
                                    <View className="flex-row items-center">
                                        <Text className="text-2xl mr-3">{item.flag}</Text>
                                        <Text className="text-gray-900 dark:text-white text-lg">{item.label}</Text>
                                    </View>
                                    {selectedLanguage === item.value && (
                                        <Text className="text-blue-500 font-bold">✓</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
            {/* Definition Selection Modal - Select Meaning */}
            <Modal
                visible={showDefinitionModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowDefinitionModal(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white dark:bg-gray-900 rounded-t-3xl p-6 h-3/4">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-gray-900 dark:text-white text-xl font-bold">Select Definition</Text>
                            <TouchableOpacity onPress={() => setShowDefinitionModal(false)}>
                                <Text className="text-blue-400 text-lg">Close</Text>
                            </TouchableOpacity>
                        </View>

                        <Text className="text-gray-400 mb-4 italic">Select the best definition for "{word}"</Text>

                        <FlatList
                            data={availableDefinitions}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className={`p-4 mb-3 rounded-xl bg-gray-100 dark:bg-gray-800 border ${definition === item.definition ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'}`}
                                    onPress={() => {
                                        setDefinition(item.definition);
                                        setPartOfSpeech(item.partOfSpeech);
                                        setShowDefinitionModal(false);
                                    }}
                                >
                                    <View className="flex-row items-center mb-1">
                                        <View className={`px-2 py-0.5 rounded mr-2 border ${getPosStyle(item.partOfSpeech)}`}>
                                            <Text className={`font-bold text-xs uppercase ${getPosStyle(item.partOfSpeech).split(' ')[1]}`}>
                                                {item.partOfSpeech}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text className="text-gray-900 dark:text-white text-base leading-5 mb-1">{item.definition}</Text>
                                    {item.example && (
                                        <Text className="text-gray-500 text-sm italic">"{item.example}"</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            <SuccessModal
                visible={showSuccessModal}
                message="Word added to your list!"
                onClose={() => { }}
                buttons={[
                    {
                        text: 'Main Menu',
                        type: 'secondary',
                        onPress: () => {
                            setWord('');
                            setDefinition('');
                            setPartOfSpeech('');
                            setShowSuccessModal(false);
                            navigation.goBack();
                        }
                    },
                    {
                        text: 'New Word',
                        type: 'primary',
                        onPress: () => {
                            setWord('');
                            setDefinition('');
                            setPartOfSpeech('');
                            setShowSuccessModal(false);
                        }
                    }
                ]}
            />

            <ErrorModal
                visible={showDuplicateModal}
                title="Duplicate Entry"
                message="This word and definition are already in your list. Please select a different definition or go back."
                onClose={() => setShowDuplicateModal(false)}
                iconColor="#f59e0b"
                buttons={[
                    {
                        text: 'Return',
                        type: 'secondary',
                        onPress: () => setShowDuplicateModal(false)
                    }
                ]}
            />
        </>
    );
}
