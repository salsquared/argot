import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { getWords, deleteWords, updateWord, saveWords } from '../utils/storage';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LANGUAGES } from '../utils/languages';
import { IS_DEV } from '../utils/config';
import { getPosStyle } from '../utils/posStyles';

export default function List({ navigation }) {
    const [words, setWords] = useState([]);
    const [loading, setLoading] = useState(true);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isMigrating, setIsMigrating] = useState(false);

    // Individual Edit Modal State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editWordText, setEditWordText] = useState('');
    const [editDefinitionText, setEditDefinitionText] = useState('');
    const [editPartOfSpeech, setEditPartOfSpeech] = useState('');

    // Edit Mode Definition Fetching
    const [availableEditDefinitions, setAvailableEditDefinitions] = useState([]);
    const [isFetchingDefinitions, setIsFetchingDefinitions] = useState(false);
    const [showEditDefinitionModal, setShowEditDefinitionModal] = useState(false);

    // Fetch definitions when editWordText changes (debounced)
    useEffect(() => {
        const fetchEditDefinition = async () => {
            const trimmedWord = editWordText.trim();
            // Don't fetch if empty, too short, or same as original (unless we want to re-suggest?)
            // Actually, if they just opened it, it matches original. We might not want to auto-overwrite, 
            // but we want to populate valid options.
            if (trimmedWord.length < 2) return;

            setIsFetchingDefinitions(true);
            try {
                const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${trimmedWord}`);
                const data = await response.json();

                if (Array.isArray(data) && data.length > 0) {
                    const definitions = [];
                    data.forEach(entry => {
                        if (entry.meanings) {
                            entry.meanings.forEach(meaning => {
                                meaning.definitions.forEach(def => {
                                    definitions.push({
                                        definition: def.definition,
                                        partOfSpeech: meaning.partOfSpeech,
                                        example: def.example
                                    });
                                });
                            });
                        }
                    });
                    setAvailableEditDefinitions(definitions);
                } else {
                    setAvailableEditDefinitions([]);
                }
            } catch (error) {
                console.log("Error fetching edit definition:", error);
                setAvailableEditDefinitions([]);
            } finally {
                setIsFetchingDefinitions(false);
            }
        };

        const timeoutId = setTimeout(() => {
            if (editModalVisible && editWordText) fetchEditDefinition();
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [editWordText, editModalVisible]);

    const loadWords = async () => {
        try {
            const savedWords = await getWords();
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
            return () => {
                // Reset edit mode when leaving screen
                setIsEditing(false);
                setSelectedIds(new Set());
            };
        }, [])
    );

    // Header Button
    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    onPress={toggleEditMode}
                    className="mr-4"
                >
                    <Text className="text-blue-400 font-bold text-lg">
                        {isEditing ? 'Done' : 'Edit'}
                    </Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation, isEditing, words]); // Update when dependencies change

    const toggleEditMode = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsEditing(!isEditing);
        setSelectedIds(new Set()); // Clear selection when toggling
    };

    const toggleSelection = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
        Haptics.selectionAsync();
    };

    const deleteSelected = () => {
        if (selectedIds.size === 0) return;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            "Delete Words",
            `Are you sure you want to delete ${selectedIds.size} word${selectedIds.size > 1 ? 's' : ''}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const newWords = await deleteWords(selectedIds);
                        setWords(newWords);
                        setIsEditing(false);
                        setSelectedIds(new Set());
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                }
            ]
        );
    };

    const startEditingItem = (item) => {
        setEditingItem(item);
        setEditWordText(item.word);
        setEditDefinitionText(item.definition);
        setEditPartOfSpeech(item.partOfSpeech);
        setAvailableEditDefinitions([]); // Reset
        setEditModalVisible(true);
    };

    const saveEdit = async () => {
        if (!editingItem || !editWordText.trim() || !editDefinitionText.trim()) return;

        const newWords = await updateWord({ ...editingItem, word: editWordText.trim(), definition: editDefinitionText.trim(), partOfSpeech: editPartOfSpeech });
        setWords(newWords);
        setEditModalVisible(false);
        setEditingItem(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    // getPosStyle is now imported from utils


    const renderItem = ({ item }) => {
        const isSelected = selectedIds.has(item.id);

        return (
            <TouchableOpacity
                className={`bg-gray-50 dark:bg-gray-800 p-4 mb-3 rounded-xl border ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-gray-700' : 'border-gray-200 dark:border-gray-700'} flex-row items-center`}
                onLongPress={() => !isEditing && startEditingItem(item)} // Allow long press to edit in normal mode too? Or maybe just context menu. 
                // Original was delete. Let's keep it clean: Long press delete in normal mode? 
                // User said "Edit button... allow to select multiple... delete or edit".
                // Let's implement strict edit mode for these actions to contain complexity.
                // Wait, "edit definition or word individually".
                onPress={() => {
                    if (isEditing) {
                        toggleSelection(item.id);
                    } else {
                        // Normal mode tap: maybe showing details? Current app shows details in-line.
                        // Let's keep it no-op or expand? For now no-op as per existing code which didn't have specific onPress logic other than longPress delete.
                    }
                }}
                activeOpacity={isEditing ? 0.7 : 1}
            >
                {isEditing && (
                    <View className={`w-6 h-6 rounded-full border-2 mr-4 justify-center items-center ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-500'}`}>
                        {isSelected && <Text className="text-white text-xs font-bold">✓</Text>}
                    </View>
                )}

                <View className="flex-1 mr-2">
                    <View className="flex-row items-center mb-1">
                        <Text className="text-gray-900 dark:text-white text-xl font-bold text-blue-600 dark:text-blue-400 mr-2">{item.word}</Text>

                        <View className="flex-row items-center">
                            <View className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-md mr-2">
                                <Text className="text-gray-700 dark:text-gray-300 text-xs font-bold">
                                    {LANGUAGES.find(l => l.value === item.language)?.flag || '🇬🇧'} {item.language || 'EN'}
                                </Text>
                            </View>

                            {item.partOfSpeech && (
                                <View className={`px-2 py-0.5 rounded-md border ${getPosStyle(item.partOfSpeech)}`}>
                                    <Text className={`font-bold text-xs uppercase ${getPosStyle(item.partOfSpeech).split(' ')[1]}`}>
                                        {item.partOfSpeech}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <Text className="text-gray-600 dark:text-gray-300 text-base">{item.definition}</Text>
                </View>

                {isEditing && (
                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            startEditingItem(item);
                        }}
                        className="p-2"
                    >
                        <Feather name="edit-2" size={20} color="#6b7280" />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    const migrateData = async () => {
        setIsMigrating(true);
        try {
            const updatedWords = await Promise.all(words.map(async (item) => {
                // 1. Format Word (Title Case)
                let newWord = item.word.trim();
                newWord = newWord.charAt(0).toUpperCase() + newWord.slice(1).toLowerCase();

                let newPos = item.partOfSpeech;

                // 2. Fetch POS if missing
                if (!newPos) {
                    try {
                        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${newWord}`);
                        const data = await response.json();

                        if (Array.isArray(data)) {
                            // Smart Match definition
                            const savedDefNorm = item.definition.toLowerCase().replace(/[^a-z0-9]/g, '');
                            let foundPos = null;

                            for (const entry of data) {
                                if (entry.meanings) {
                                    for (const meaning of entry.meanings) {
                                        for (const defObj of meaning.definitions) {
                                            const apiDefNorm = defObj.definition.toLowerCase().replace(/[^a-z0-9]/g, '');
                                            // Check for rough match
                                            if (apiDefNorm.includes(savedDefNorm) || savedDefNorm.includes(apiDefNorm)) {
                                                foundPos = meaning.partOfSpeech;
                                                break;
                                            }
                                        }
                                        if (foundPos) break;
                                    }
                                }
                                if (foundPos) break;
                            }

                            if (foundPos) {
                                newPos = foundPos;
                            }
                        }
                    } catch (err) {
                        console.log(`Migration fetch error for ${newWord}:`, err);
                    }
                }

                return {
                    ...item,
                    word: newWord,
                    partOfSpeech: newPos
                };
            }));

            setWords(updatedWords);
            await saveWords(updatedWords);
            Alert.alert("Migration Complete", "Words formatted and POS tags updated.");

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Migration failed");
        } finally {
            setIsMigrating(false);
        }
    };

    return (
        <View className="flex-1 bg-white dark:bg-gray-900">
            {isMigrating && (
                <View className="absolute z-10 inset-0 bg-black/50 justify-center items-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text className="text-white mt-4 font-bold">Migrating Data...</Text>
                </View>
            )}

            {words.length === 0 && !loading ? (
                <View className="flex-1 justify-center items-center p-4">
                    <Text className="text-gray-500 text-lg">No words added yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={words}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    ListHeaderComponent={
                        IS_DEV ? (
                            <TouchableOpacity
                                onPress={migrateData}
                                className="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl mb-4 border border-gray-200 dark:border-gray-700 items-center"
                            >
                                <Text className="text-blue-600 dark:text-blue-400 font-bold">Refresh Metadata</Text>
                            </TouchableOpacity>
                        ) : null
                    }
                />
            )}

            {/* Bottom Bar for Delete */}
            {isEditing && selectedIds.size > 0 && (
                <View className="absolute bottom-0 left-0 right-0 p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 items-center">
                    <TouchableOpacity
                        onPress={deleteSelected}
                        className="bg-red-600 px-8 py-3 rounded-xl"
                    >
                        <Text className="text-white font-bold text-lg">Delete ({selectedIds.size})</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Editing Modal */}
            <Modal
                visible={editModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1 justify-end bg-black/60"
                >
                    <View className="bg-white dark:bg-gray-900 rounded-t-3xl p-6 h-auto max-h-[90%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-gray-900 dark:text-white text-xl font-bold">Edit Word</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Text className="text-blue-400 text-lg">Cancel</Text>
                            </TouchableOpacity>
                        </View>

                        <Text className="text-gray-500 dark:text-gray-400 mb-2 font-bold">Word</Text>
                        <View className="relative">
                            <TextInput
                                className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-xl mb-4 text-lg border border-gray-200 dark:border-gray-700 focus:border-blue-500"
                                value={editWordText}
                                onChangeText={setEditWordText}
                            />
                            {isFetchingDefinitions && (
                                <View className="absolute right-4 top-4">
                                    <ActivityIndicator size="small" color="#3b82f6" />
                                </View>
                            )}
                        </View>

                        <View className="flex-row justify-between mb-2">
                            <Text className="text-gray-400 font-bold">Definition</Text>
                            {availableEditDefinitions.length > 0 && (
                                <TouchableOpacity onPress={() => setShowEditDefinitionModal(true)}>
                                    <Text className="text-blue-400 text-sm font-bold">Select Definition ({availableEditDefinitions.length})</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <TextInput
                            className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-xl mb-6 text-lg border border-gray-200 dark:border-gray-700 h-32 focus:border-blue-500"
                            multiline
                            textAlignVertical="top"
                            value={editDefinitionText}
                            onChangeText={setEditDefinitionText}
                        />

                        <TouchableOpacity
                            className="bg-blue-600 p-4 rounded-xl items-center mb-4"
                            onPress={saveEdit}
                        >
                            <Text className="text-white font-bold text-lg">Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Definition Selection Modal for Edit Mode */}
            <Modal
                visible={showEditDefinitionModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowEditDefinitionModal(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white dark:bg-gray-900 rounded-t-3xl p-6 h-3/4">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-gray-900 dark:text-white text-xl font-bold">Select Definition</Text>
                            <TouchableOpacity onPress={() => setShowEditDefinitionModal(false)}>
                                <Text className="text-blue-400 text-lg">Close</Text>
                            </TouchableOpacity>
                        </View>

                        <Text className="text-gray-500 dark:text-gray-400 mb-4 italic">Select definition for "{editWordText}"</Text>

                        <FlatList
                            data={availableEditDefinitions}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className={`p-4 mb-3 rounded-xl bg-gray-100 dark:bg-gray-800 border ${editDefinitionText === item.definition ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'}`}
                                    onPress={() => {
                                        setEditDefinitionText(item.definition);
                                        setEditPartOfSpeech(item.partOfSpeech);
                                        setShowEditDefinitionModal(false);
                                    }}
                                >
                                    <View className="flex-row items-center mb-1">
                                        {item.partOfSpeech && (
                                            <View className={`px-2 py-0.5 rounded-md border mr-2 ${getPosStyle(item.partOfSpeech)}`}>
                                                <Text className={`font-bold text-xs uppercase ${getPosStyle(item.partOfSpeech).split(' ')[1]}`}>
                                                    {item.partOfSpeech}
                                                </Text>
                                            </View>
                                        )}
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
        </View>
    );
}
