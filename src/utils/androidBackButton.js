import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export async function registerAndroidBackButton(handler) {
  if (Capacitor.getPlatform() !== 'android') return () => {};
  const listener = await App.addListener('backButton', handler);
  return () => listener.remove();
}

export function exitAndroidApp() {
  if (Capacitor.getPlatform() === 'android') return App.exitApp();
  return undefined;
}
