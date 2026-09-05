import type { DataSourceMode, IDataProvider } from './types';
import { DemoDataProvider } from './DemoDataProvider';
import { LiveDataProvider } from './LiveDataProvider';

export * from './types';
export { DemoDataProvider } from './DemoDataProvider';
export { LiveDataProvider } from './LiveDataProvider';

// Singleton instances for persistent state across component renders
export const demoDataProvider = new DemoDataProvider();
export const liveDataProvider = new LiveDataProvider();

/**
 * Returns the active data provider according to the selected mode.
 */
export function getDataProvider(mode: DataSourceMode): IDataProvider {
  return mode === 'LIVE' ? liveDataProvider : demoDataProvider;
}
