import { v4 as uuidv4 } from 'uuid';

/**
 * Represents a User.
 * @class
 */
export class User {
  /**
   * Creates an instance of User.
   * @param {string} name - The name of the user.
   * @param {string} [email=''] - The email of the user (optional).
   * @param {string|null} [id=null] - Optional ID. If not provided, a new one will be generated.
   */
  constructor(name, email = '', id = null) {
    if (!name) {
      throw new Error("User name is required.");
    }

    this.id = id || uuidv4();
    this.name = name;
    this.email = email;
  }
}

/**
 * Creates a new user instance.
 * @param {string} name - The name of the user.
 * @param {string} [email=''] - The email of the user.
 * @returns {User} A new User object.
 */
export function createUser(name, email = '') {
  return new User(name, email);
}
