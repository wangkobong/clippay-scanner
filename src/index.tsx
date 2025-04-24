import { NativeModules, Platform } from 'react-native';
import { PassportScanScreen } from './components/PassportScanScreen';
export * from './services';
export * from './models';

const LINKING_ERROR =
  `The package 'react-native-clippay-scanner' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const NativeClippayScanner = NativeModules.ClippayScanner
  ? NativeModules.ClippayScanner
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export function multiply(a: number, b: number): number {
  return NativeClippayScanner.multiply(a, b);
}

export { PassportScanScreen };
