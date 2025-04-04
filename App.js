// App.js
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

// Import screens
import SearchScreen from './screens/SearchScreen';
import QueriesScreen from './screens/QueriesScreen';
import CompareScreen from './screens/CompareScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: '#2f95dc',
            tabBarStyle: styles.tabBar,
          }}
        >
          <Tab.Screen
            name="Search"
            component={SearchScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="search" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Queries"
            component={QueriesScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="storage" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Compare"
            component={CompareScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="compare" size={size} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    paddingBottom: 5,
    height: 60,
  },
});