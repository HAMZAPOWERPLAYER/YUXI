import Constants from 'expo-constants';

/** Store identity from app.json, with a safe fallback for bare test renders. */
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
export const APP_CONTACT_EMAIL = 'hamzapowerplayer.global@gmail.com';
