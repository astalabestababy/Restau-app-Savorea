import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Base URL for API calls, must end with `/api`.
 *
 * Preferred override:
 *   EXPO_PUBLIC_API_URL=https://your-api.example.com/api
 *
 * Fallback order:
 *   1. EXPO_PUBLIC_API_URL
 *   2. Expo config extra.apiUrl
 *   3. Metro host in local dev
 *   4. Render production API
 */
function normalizeApiUrl(url) {
    if (!url || typeof url !== 'string') return null;
    const normalized = url.trim().replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(normalized)) return null;
    return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
}

const DEFAULT_PRODUCTION_API = 'https://savorea.onrender.com/api';

function getExtraApiUrl() {
    return normalizeApiUrl(
        Constants.expoConfig?.extra?.apiUrl ||
        Constants.manifest?.extra?.apiUrl ||
        Constants.manifest2?.extra?.expoClient?.extra?.apiUrl
    );
}

function getDebuggerHost() {
    return Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || null;
}

function getApiConfig() {
    const fromEnv = normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL);
    if (fromEnv) {
        return { url: fromEnv, source: 'env' };
    }

    const fromExtra = getExtraApiUrl();
    if (fromExtra) {
        return { url: fromExtra, source: 'expo-extra' };
    }

    if (Platform.OS === 'web') {
        return { url: 'http://localhost:5000/api', source: 'web-localhost' };
    }

    const debuggerHost = getDebuggerHost();
    if (typeof __DEV__ !== 'undefined' && __DEV__ && debuggerHost) {
        let host = debuggerHost.split(':')[0];
        if (Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1')) {
            host = '10.0.2.2';
        }
        return { url: `http://${host}:5000/api`, source: 'metro-host' };
    }

    return { url: DEFAULT_PRODUCTION_API, source: 'default-production' };
}

const { url: API_URL, source: API_SOURCE } = getApiConfig();

console.log('[API CONFIG] Using API_URL:', API_URL, 'source:', API_SOURCE);

export default API_URL;
