import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Modal, FlatList } from 'react-native';
import { LANGUAGES } from '../utils/languages';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

export default function AddWord({ navigation }) {
    const [word, setWord] = useState('');
    const [definition, setDefinition] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('EN');
    const [showLangModal, setShowLangModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredLanguages = useMemo(() => {
        return LANGUAGES.filter(lang =>
            lang.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lang.value.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    // Debounce effect to fetch definition
    useEffect(() => {
        const fetchDefinition = async () => {
            const trimmedWord = word.trim();
            if (trimmedWord.length < 2 || selectedLanguage !== 'EN') return;

            setIsLoading(true);
            try {
                const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${trimmedWord}`);
                const data = await response.json();

                if (Array.isArray(data) && data.length > 0) {
                    const firstDef = data[0].meanings[0]?.definitions[0]?.definition;
                    if (firstDef) {
                        setDefinition(firstDef);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                }
            } catch (error) {
                // Silent fail - user can still type manually
                console.log("Error fetching definition:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            if (word) fetchDefinition();
        }, 1000); // 1 second debounce

        return () => clearTimeout(timeoutId);
    }, [word, selectedLanguage]);

    const saveWord = async () => {
        if (!word.trim() || !definition.trim()) {
            Alert.alert('Error', 'Please enter both a word and a definition.');
            return;
        }

        try {
            const newEntry = {
                id: Date.now().toString(),
                word: word.trim(),
                definition: definition.trim(),

                language: selectedLanguage,
                dateAdded: new Date().toISOString(),
            };

            const existingData = await AsyncStorage.getItem('vocabList');
            const words = existingData ? JSON.parse(existingData) : [];

            const updatedWords = [newEntry, ...words];
            await AsyncStorage.setItem('vocabList', JSON.stringify(updatedWords));

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Word added to your list!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);

            setWord('');
            setDefinition('');

        } catch (e) {
            Alert.alert('Error', 'Failed to save word.');
            console.error(e);
        }
    };

    const formContent = (
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="handled">
            <View className="flex-row justify-between items-center mb-2">
                <Text className="text-white text-lg font-bold">Word</Text>
                <TouchableOpacity
                    onPress={() => setShowLangModal(true)}
                    className="bg-gray-800 px-3 py-1 rounded-full border border-gray-600 flex-row items-center"
                >
                    <Text className="text-white font-bold mr-1">
                        {LANGUAGES.find(l => l.value === selectedLanguage)?.flag} {selectedLanguage}
                    </Text>
                </TouchableOpacity>
            </View>
            <View className="relative">
                <TextInput
                    className="bg-gray-800 text-white p-4 rounded-xl mb-6 text-lg border border-gray-700 focus:border-blue-500"
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
                <Text className="text-white text-lg font-bold">Definition</Text>
                {isLoading && <Text className="text-blue-400 text-sm italic">Searching...</Text>}
            </View>

            <TextInput
                className="bg-gray-800 text-white p-4 rounded-xl mb-8 text-lg border border-gray-700 h-32 focus:border-blue-500"
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
                    className="flex-1 bg-gray-900"
                >
                    {formContent}
                </KeyboardAvoidingView>
            ) : (
                <View className="flex-1 bg-gray-900">
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
                    <View className="bg-gray-900 rounded-t-3xl p-6 h-2/3">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-white text-xl font-bold">Select Language</Text>
                            <TouchableOpacity onPress={() => setShowLangModal(false)}>
                                <Text className="text-blue-400 text-lg">Done</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            className="bg-gray-800 text-white p-3 rounded-xl mb-4 text-base border border-gray-700"
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
                                    className={`p-4 mb-2 rounded-xl flex-row items-center justify-between ${selectedLanguage === item.value ? 'bg-gray-800 border border-blue-500' : 'bg-gray-800'}`}
                                    onPress={() => {
                                        setSelectedLanguage(item.value);
                                        setShowLangModal(false);
                                    }}
                                >
                                    <View className="flex-row items-center">
                                        <Text className="text-2xl mr-3">{item.flag}</Text>
                                        <Text className="text-white text-lg">{item.label}</Text>
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
        </>
    );
}
