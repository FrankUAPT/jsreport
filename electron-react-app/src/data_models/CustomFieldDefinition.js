import { v4 as uuidv4 } from 'uuid';

/**
 * Represents a Custom Field Definition.
 * @class
 */
export class CustomFieldDefinition {
  /**
   * Creates an instance of CustomFieldDefinition.
   * @param {string} name - The name of the custom field (e.g., "Priority", "Budget Impact").
   * @param {string} type - The type of the custom field ('text', 'textarea', 'number', 'date', 'dropdown', 'checkbox').
   * @param {Array<string>} [options=[]] - Options for 'dropdown' type.
   * @param {string|null} [projectId=null] - Optional project ID to scope the field.
   * @param {string|null} [id=null] - Optional ID. If not provided, a new one will be generated.
   */
  constructor(name, type, options = [], projectId = null, id = null) {
    if (!name) {
      throw new Error("Custom field definition name is required.");
    }
    if (!type) {
      throw new Error("Custom field definition type is required.");
    }
    const validTypes = ['text', 'textarea', 'number', 'date', 'dropdown', 'checkbox'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid custom field type: ${type}. Must be one of ${validTypes.join(', ')}.`);
    }
    if (type === 'dropdown' && (!Array.isArray(options) || options.length === 0)) {
      throw new Error("Options are required for dropdown custom fields and must be a non-empty array.");
    }

    this.id = id || uuidv4();
    this.name = name;
    this.type = type;
    this.options = type === 'dropdown' ? options : []; // Only store options for dropdown
    this.projectId = projectId; // For future use, currently global
  }
}

/**
 * Creates a new CustomFieldDefinition instance.
 * @param {string} name - The name of the custom field.
 * @param {string} type - The type of the custom field.
 * @param {Array<string>} [options=[]] - Options for 'dropdown' type.
 * @param {string|null} [projectId=null] - Optional project ID.
 * @returns {CustomFieldDefinition} A new CustomFieldDefinition object.
 */
export function createCustomFieldDefinition(name, type, options = [], projectId = null) {
  return new CustomFieldDefinition(name, type, options, projectId);
}
