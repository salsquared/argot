import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Home({ navigation }) {
    const [wordCount, setWordCount] = useState(0);

    // Refresh count when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            const getCount = async () => {
                try {
                    const jsonValue = await AsyncStorage.getItem('vocabList');
                    const words = jsonValue != null ? JSON.parse(jsonValue) : [];
                    setWordCount(words.length);
                } catch (e) {
                    // error reading value
                }
            };
            getCount();
        }, [])
    );

    return (
        <View className="flex-1 bg-white dark:bg-gray-900 items-center justify-center p-6">
            <Text className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Argot</Text>
            <Text className="text-gray-500 dark:text-gray-400 mb-10">{wordCount} words collected</Text>

            <TouchableOpacity
                className="bg-blue-600 w-full p-4 rounded-xl mb-4 items-center"
                onPress={() => navigation.navigate('AddWord')}
            >
                <Text className="text-white text-lg font-bold">Add New Word</Text>
            </TouchableOpacity>

            <TouchableOpacity
                className="bg-gray-800 dark:bg-gray-700 w-full p-4 rounded-xl mb-4 items-center"
                onPress={() => navigation.navigate('List')}
            >
                <Text className="text-white text-lg font-bold">My Vocabulary</Text>
            </TouchableOpacity>

            <TouchableOpacity
                className="bg-purple-600 w-full p-4 rounded-xl mb-4 items-center"
                onPress={() => navigation.navigate('Quiz')}
            >
                <Text className="text-white text-lg font-bold">Start Quiz</Text>
            </TouchableOpacity>

            <TouchableOpacity
                className="bg-gray-200 dark:bg-gray-800 w-full p-4 rounded-xl mb-4 items-center mt-4"
                onPress={() => navigation.navigate('Settings')}
            >
                <Text className="text-gray-900 dark:text-white text-lg font-bold">Settings</Text>
            </TouchableOpacity>
        </View>
    );
}
