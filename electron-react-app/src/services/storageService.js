import Store from 'electron-store';

// Initialize electron-store.
// It's important that if `Store.initRenderer()` was called in main.js,
// the renderer process can create its own Store instances.
// This store instance will be used by the service.
const store = new Store();

const TASKS_KEY = 'tasks';
const USERS_KEY = 'users';
const CUSTOM_FIELD_DEFS_KEY = 'customFieldDefinitions';

/**
 * Loads tasks from electron-store.
 * @returns {Array|undefined} The array of tasks, or undefined if not found.
 */
export const loadTasks = () => {
  return store.get(TASKS_KEY);
};

/**
 * Saves tasks to electron-store.
 * @param {Array} tasks - The array of tasks to save.
 */
export const saveTasks = (tasks) => {
  store.set(TASKS_KEY, tasks);
};

/**
 * Loads users from electron-store.
 * @returns {Array|undefined} The array of users, or undefined if not found.
 */
export const loadUsers = () => {
  return store.get(USERS_KEY);
};

/**
 * Saves users to electron-store.
 * @param {Array} users - The array of users to save.
 */
export const saveUsers = (users) => {
  store.set(USERS_KEY, users);
};

/**
 * Clears all tasks and users from the store. (For debugging/testing)
 */
export const clearAllData = () => {
  store.delete(TASKS_KEY);
  store.delete(USERS_KEY);
  store.delete(CUSTOM_FIELD_DEFS_KEY);
  console.log('Cleared all tasks, users, and custom field definitions from electron-store.');
};

// Example of how to clear data from the console in development:
// window.electronStorageService = { clearAllData };
// Then in DevTools console: window.electronStorageService.clearAllData()
// This is optional and depends on how you want to expose such utilities.
// For now, just having the function is enough. It can be called from App.js if needed.

/**
 * Loads custom field definitions from electron-store.
 * @returns {Array|undefined} The array of definitions, or undefined if not found.
 */
export const loadCustomFieldDefinitions = () => {
  return store.get(CUSTOM_FIELD_DEFS_KEY);
};

/**
 * Saves custom field definitions to electron-store.
 * @param {Array} definitions - The array of definitions to save.
 */
export const saveCustomFieldDefinitions = (definitions) => {
  store.set(CUSTOM_FIELD_DEFS_KEY, definitions);
};
