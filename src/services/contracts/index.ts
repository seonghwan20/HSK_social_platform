// Export services
export { FaucetService } from './FaucetService';
export { BattleFactoryService } from './BattleFactoryService';
export { SideBettingService } from './SideBettingService';

// Import services for singleton initialization
import { FaucetService } from './FaucetService';
import { BattleFactoryService } from './BattleFactoryService';
import { SideBettingService } from './SideBettingService';

// Export singleton instances that can be used globally
export const faucetService = new FaucetService(null); // Initialize with null, will be updated when provider is available
export const battleFactoryService = new BattleFactoryService(null); // Initialize with null, will be updated when provider is available
export const sideBettingService = new SideBettingService(null); // Initialize with null, will be updated when provider is available