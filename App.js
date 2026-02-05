import 'react-native-gesture-handler';
import './global.css';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Home from './screens/Home';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AddWord from './screens/AddWord';
import List from './screens/List';
import Quiz from './screens/Quiz';
import Settings from './screens/Settings';
import { useColorScheme } from 'nativewind';

const Stack = createStackNavigator();

// Force refresh
export default function App() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const theme = isDark ? DarkTheme : DefaultTheme;
  const headerStyle = {
    backgroundColor: isDark ? '#111827' : '#ffffff',
  };
  const headerTintColor = isDark ? '#fff' : '#000';
  const contentStyle = {
    backgroundColor: isDark ? '#111827' : '#ffffff',
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={theme}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: headerStyle,
            headerTintColor: headerTintColor,
            headerTitleStyle: { fontWeight: 'bold' },
            contentStyle: contentStyle,
            cardStyle: contentStyle
          }}
        >
          <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
          <Stack.Screen name="AddWord" component={AddWord} options={{ title: 'Add Word' }} />
          <Stack.Screen name="List" component={List} options={{ title: 'My List' }} />
          <Stack.Screen name="Quiz" component={Quiz} options={{ title: 'Quiz' }} />
          <Stack.Screen name="Settings" component={Settings} options={{ title: 'Settings' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
