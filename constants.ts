
import { AppModule, EnvironmentData } from './types';

// This file used to contain mock data. 
// Most has been removed as the app now connects to a live Supabase database.
// Retaining constants that are independent of the database or for chart demonstration.

export const MODULES: AppModule[] = [ 'dashboard', 'crops', 'environment', 'smartdevices', 'gap', 'inventory', 'sales', 'hr', 'ledger', 'profitability', 'reports', 'assistant', 'settings', 'admin' ];

// Keep environment data for chart demonstration as this is often sourced differently (e.g., IoT sensors)
export const MOCK_ENVIRONMENT_DATA: EnvironmentData[] = [
    { time: '00:00', temperature: 22, humidity: 85, light: 0 },
    { time: '03:00', temperature: 21, humidity: 88, light: 0 },
    { time: '06:00', temperature: 24, humidity: 82, light: 200 },
    { time: '09:00', temperature: 28, humidity: 75, light: 800 },
    { time: '12:00', temperature: 32, humidity: 65, light: 1500 },
    { time: '15:00', temperature: 31, humidity: 68, light: 1200 },
    { time: '18:00', temperature: 27, humidity: 78, light: 150 },
    { time: '21:00', temperature: 24, humidity: 84, light: 0 },
];
