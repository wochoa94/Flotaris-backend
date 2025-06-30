/**
 * Utility functions for converting object keys between camelCase and snake_case
 */

/**
 * Converts a string from camelCase to snake_case
 * @param {string} str - The camelCase string to convert
 * @returns {string} The snake_case string
 */
function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Converts a string from snake_case to camelCase
 * @param {string} str - The snake_case string to convert
 * @returns {string} The camelCase string
 */
function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * Recursively converts all object keys from camelCase to snake_case
 * @param {any} obj - The object/array/primitive to convert
 * @returns {any} The converted object with snake_case keys
 */
export function convertKeysToSnakeCase(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertKeysToSnakeCase);
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = camelToSnake(key);
      converted[snakeKey] = convertKeysToSnakeCase(value);
    }
    return converted;
  }

  return obj;
}

/**
 * Recursively converts all object keys from snake_case to camelCase
 * @param {any} obj - The object/array/primitive to convert
 * @returns {any} The converted object with camelCase keys
 */
export function convertKeysToCamelCase(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamelCase);
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = snakeToCamel(key);
      converted[camelKey] = convertKeysToCamelCase(value);
    }
    return converted;
  }

  return obj;
}