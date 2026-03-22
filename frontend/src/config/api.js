import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Base URL for API calls, must end with `/api`.
 *
 * iOS (physical device, Expo Go / dev client):
 *   Use Expo LAN (not Tunnel). Set `frontend/.env`:
 *   EXPO_PUBLIC_API_URL=http://YOUR_PC_LAN_IP:5000/api
 *   (iOS needs ATS local-network allowance in app.json — see NSAllowsLocalNetworking.)
 *
 * Android APK (EAS preview/production):
 *   Bake the real API URL at build time via the same env var in `eas.json` → build profile → `env`,
 *   or set `expo.extra.apiUrl` in app.json for a fixed production base.
 *   Prefer HTTPS for public APKs; `usesCleartextTraffic` is only for HTTP during dev.
 *
 * Android emulator: localhost from Metro is mapped to 10.0.2.2 so the emulator can reach the host.
 */
function normalizeApiUrl(url) {
    if (!url || typeof url !== 'string') return null;
    const u = url.trim().replace(/\/+$/, '');
    if (!u.startsWith('http')) return null;
    return u.endsWith('/api') ? u : `${u}/api`;
}

const getApiUrl = () => {
    const fromEnv = normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL);
    if (fromEnv) {
        return fromEnv;
    }

    const fromExtra = normalizeApiUrl(Constants.expoConfig?.extra?.apiUrl);
    if (fromExtra) {
        return fromExtra;
    }

    if (Platform.OS === 'web') {
        return 'http://localhost:5000/api';
    }

    const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;

    if (debuggerHost) {
        let host = debuggerHost.split(':')[0];
        if (Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1')) {
            host = '10.0.2.2';
        }
        return `http://${host}:5000/api`;
    }

    return 'http://192.168.100.13:5000/api';
};

const API_URL = getApiUrl();
console.log('[API CONFIG] Using API_URL:', API_URL);

export default API_URL;
