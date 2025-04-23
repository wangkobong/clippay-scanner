import ClippayScanner from './NativeClippayScanner';
import PassportScanScreen from './components/PassportScanScreen';

export function multiply(a: number, b: number): number {
  return ClippayScanner.multiply(a, b);
}

export { PassportScanScreen };
