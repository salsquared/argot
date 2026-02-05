import React from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { useColorScheme } from 'nativewind';

export default function Settings() {
    const { colorScheme, toggleColorScheme } = useColorScheme();

    return (
        <ScrollView className="flex-1 bg-white dark:bg-gray-900">
            <View className="p-6">
                <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Settings</Text>

                <View className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-4 flex-row items-center justify-between">
                    <View>
                        <Text className="text-lg font-bold text-gray-900 dark:text-white">Dark Mode</Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-sm">Toggle app theme</Text>
                    </View>
                    <Switch
                        value={colorScheme === 'dark'}
                        onValueChange={toggleColorScheme}
                        trackColor={{ false: '#767577', true: '#2563eb' }}
                        thumbColor={colorScheme === 'dark' ? '#fff' : '#f4f3f4'}
                    />
                </View>

                {/* Placeholder for future settings */}
                <View className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-4">
                    <Text className="text-lg font-bold text-gray-900 dark:text-white mb-2">About</Text>
                    <Text className="text-gray-500 dark:text-gray-400">Argot v0.0.1</Text>
                    <Text className="text-gray-500 dark:text-gray-400 mt-1">
                        An esoteric vocabulary application designed to help you learn and retain unique words.
                    </Text>
                </View>

            </View>
        </ScrollView>
    );
}
