// Export all API modules for easy imports
export * from './auth';
export * from './users';
export * from './userActivity';
export * from './products';
export * from './orders';
export * from './analytics';
export * from './promotions';
export * from './notifications';
export * from './categories';
export * from './reviews';
export * from './carts';
export * from './customers';
export * from './system';
export * from './event-log';
export * from './account-balances';
export * from './api-keys';
export * from './search-history';
export * from './types';
export * from './news';
export * from './settings';
export * from './importExport';

// Specific exports to avoid naming conflicts
export { returnsApi } from './returns';
export { financeApi } from './finance';
export { paymentsApi } from './payments';
export { analyticsApi } from './analytics';
