export { FaucetService } from './FaucetService';
export * from './types';

// Create singleton instance for global use
import { FaucetService } from './FaucetService';
export const faucetService = new FaucetService(null); // Initialize with null, will be updated when provider is available
