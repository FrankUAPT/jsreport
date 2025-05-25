/**
 * Calculates the duration of a task in milliseconds.
 * @param {object} task - The task object with startDate and endDate.
 * @returns {number} Duration in milliseconds.
 */
function getTaskDuration(task) {
  return new Date(task.endDate).getTime() - new Date(task.startDate).getTime();
}

/**
 * Adds days to a date.
 * @param {Date} date - The initial date.
 * @param {number} days - The number of days to add (can be negative).
 * @returns {Date} The new date.
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}


/**
 * Reschedules successor tasks based on a changed predecessor.
 * @param {string} changedTaskId - The ID of the task that was changed.
 * @param {Array<object>} allTasks - The full list of all tasks.
 * @param {Set<string>} [processedInThisChain=new Set()] - Used to prevent infinite loops in circular dependencies.
 * @returns {Array<object>} The updated list of all tasks.
 */
export function rescheduleSuccessors(changedTaskId, allTasks, processedInThisChain = new Set()) {
  if (processedInThisChain.has(changedTaskId)) {
    console.warn(`Circular dependency detected or task ${changedTaskId} already processed in this chain. Aborting further rescheduling for this path.`);
    return allTasks; // Return original tasks to prevent infinite loop changes
  }
  processedInThisChain.add(changedTaskId);

  let tasksMap = new Map(allTasks.map(task => [task.id, { ...task }])); // Create a mutable map
  const changedTask = tasksMap.get(changedTaskId);

  if (!changedTask) {
    console.error(`Task with ID ${changedTaskId} not found.`);
    return allTasks;
  }

  for (const task of tasksMap.values()) {
    if (task.dependencies && task.dependencies.length > 0) {
      for (const dep of task.dependencies) {
        if (dep.predecessorId === changedTaskId) {
          const successorTask = task; // Current task in iteration is the successor
          const predecessorTask = changedTask; // The task that just changed

          let newStartDate;
          const lagMilliseconds = (dep.lag || 0) * 24 * 60 * 60 * 1000;
          const successorDuration = getTaskDuration(successorTask);

          switch (dep.type) {
            case 'FS': // Finish to Start
              newStartDate = new Date(new Date(predecessorTask.endDate).getTime() + lagMilliseconds);
              break;
            case 'SS': // Start to Start
              newStartDate = new Date(new Date(predecessorTask.startDate).getTime() + lagMilliseconds);
              break;
            case 'FF': // Finish to Finish
              // New End Date for successor = Predecessor End Date + Lag
              // New Start Date for successor = New End Date for successor - Successor Duration
              const newEndDateFF = new Date(new Date(predecessorTask.endDate).getTime() + lagMilliseconds);
              newStartDate = new Date(newEndDateFF.getTime() - successorDuration);
              break;
            case 'SF': // Start to Finish
              // New End Date for successor = Predecessor Start Date + Lag
              // New Start Date for successor = New End Date for successor - Successor Duration
              const newEndDateSF = new Date(new Date(predecessorTask.startDate).getTime() + lagMilliseconds);
              newStartDate = new Date(newEndDateSF.getTime() - successorDuration);
              break;
            default:
              console.warn(`Unknown dependency type: ${dep.type} for task ${successorTask.id}`);
              continue; // Skip this dependency
          }

          const newEndDate = new Date(newStartDate.getTime() + successorDuration);

          // Update the successor task in the map
          const updatedSuccessor = {
            ...successorTask,
            startDate: newStartDate.toISOString(),
            endDate: newEndDate.toISOString(),
          };
          tasksMap.set(successorTask.id, updatedSuccessor);

          // Recursively reschedule successors of this updated successor
          // Create a new Set for the recursive call to manage different branches of rescheduling independently
          // while still preventing cycles within a single processing chain initiated by the top-level changedTaskId.
          rescheduleSuccessors(successorTask.id, Array.from(tasksMap.values()), new Set(processedInThisChain));
          
          // After the recursive call, other tasks might have been updated in tasksMap.
          // We need to re-fetch all tasks from the map to continue the current loop correctly.
          // This is implicitly handled because tasksMap is updated by reference in recursive calls.
        }
      }
    }
  }
  return Array.from(tasksMap.values());
}
