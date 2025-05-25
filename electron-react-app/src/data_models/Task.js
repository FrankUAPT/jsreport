import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique ID.
 * @returns {string} A unique ID.
 */
export function generateUniqueId() {
  return uuidv4();
}

/**
 * Represents a Task.
 * @class
 */
export class Task {
  /**
   * Creates an instance of Task.
   * @param {object} taskData - The data to create the task with.
   * @param {string} taskData.name - The name of the task.
   * @param {string|null} [taskData.parentId=null] - The ID of the parent task.
   * @param {Date} [taskData.startDate=new Date()] - The start date of the task.
   * @param {Date} [taskData.endDate=new Date()] - The end date of the task.
   * @param {string} [taskData.status="To Do"] - The status of the task.
   * @param {string|null} [taskData.assigneeId=null] - The ID of the assignee.
   * @param {number} [taskData.progress=0] - The progress of the task (0-100).
   * @param {boolean} [taskData.isMilestone=false] - Whether the task is a milestone.
   * @param {object} [taskData.customFields={}] - Custom fields for the task.
   * @param {string|null} [id=null] - Optional ID. If not provided, a new one will be generated.
   * @param {Array<string>} [childrenIds=[]] - Optional children IDs.
   */
  constructor({
    name,
    parentId = null,
    startDate = new Date(),
    endDate = new Date(),
    status = "To Do",
    assigneeId = null,
    progress = 0,
    isMilestone = false,
    customFields = {},
    dependencies = [] // New field for task dependencies
  }, id = null, childrenIds = []) {
    if (!name) {
      throw new Error("Task name is required.");
    }

    this.id = id || generateUniqueId();
    this.name = name;
    this.parentId = parentId;
    this.childrenIds = childrenIds || []; // Ensure it's always an array
    this.startDate = startDate instanceof Date ? startDate.toISOString() : new Date(startDate).toISOString();
    this.endDate = endDate instanceof Date ? endDate.toISOString() : new Date(endDate).toISOString();
    this.status = status;
    this.assigneeId = assigneeId;
    this.progress = progress;
    this.isMilestone = isMilestone;
    this.customFields = customFields;
    // Ensure dependencies is an array and defaults to empty if not provided or null
    this.dependencies = Array.isArray(dependencies) ? dependencies : []; 
  }

  /**
   * Adds a child task ID to this task.
   * @param {string} childId - The ID of the child task.
   */
  addChild(childId) {
    if (childId && !this.childrenIds.includes(childId)) {
      this.childrenIds.push(childId);
    }
  }

  /**
   * Removes a child task ID from this task.
   * @param {string} childId - The ID of the child task to remove.
   */
  removeChild(childId) {
    this.childrenIds = this.childrenIds.filter(id => id !== childId);
  }
}

/**
 * Creates a new task instance.
 * @param {object} taskData - The data for the task. See Task constructor.
 * @param {string|null} [id=null] - Optional ID.
 * @param {Array<string>} [childrenIds=[]] - Optional children IDs.
 * @returns {Task} A new Task object.
 */
export function createTask(taskData, id = null, childrenIds = []) {
  // Pass id and childrenIds to the constructor if they are intended to be set during creation
  // The constructor already handles id generation if 'id' is null.
  // childrenIds is also handled by the constructor.
  return new Task(taskData, id, childrenIds);
}
