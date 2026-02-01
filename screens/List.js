import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { LANGUAGES } from '../utils/languages';

export default function List() {
    const [words, setWords] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadWords = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem('vocabList');
            const savedWords = jsonValue != null ? JSON.parse(jsonValue) : [];
            setWords(savedWords);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            loadWords();
        }, [])
    );

    const deleteWord = async (id) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
            "Remove Word",
            "Are you sure you want to remove this word?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        const newWords = words.filter(item => item.id !== id);
                        setWords(newWords);
                        await AsyncStorage.setItem('vocabList', JSON.stringify(newWords));
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            className="bg-gray-800 p-4 mb-3 rounded-xl border border-gray-700"
            onLongPress={() => deleteWord(item.id)}
        >
            <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-2">
                    <View className="flex-row items-center mb-1">
                        <Text className="text-white text-xl font-bold text-blue-400 mr-2">{item.word}</Text>
                        <View className="bg-gray-700 px-2 py-0.5 rounded-md">
                            <Text className="text-gray-300 text-xs font-bold">
                                {LANGUAGES.find(l => l.value === item.language)?.flag || '🇬🇧'} {item.language || 'EN'}
                            </Text>
                        </View>
                    </View>
                    <Text className="text-gray-300 text-base">{item.definition}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-gray-900 p-4">
            {words.length === 0 && !loading ? (
                <View className="flex-1 justify-center items-center">
                    <Text className="text-gray-500 text-lg">No words added yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={words}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                    className="w-full"
                />
            )}
        </View>
    );
}
