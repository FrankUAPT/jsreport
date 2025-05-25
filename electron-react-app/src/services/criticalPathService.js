/**
 * Helper to get task duration in days.
 * Assumes dates are ISO strings.
 * Includes the end day, so a task from 2024-01-01 to 2024-01-01 has duration 1.
 */
function getDurationInDays(startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  // Normalize to the start of the day to avoid time zone issues affecting day count
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 1; // Minimum duration is 1 day
}

/**
 * Adds days to a given date string (ISO format) and returns a new ISO string.
 */
function addDaysToDate(dateStr, days) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/**
 * Calculates the critical path for a given set of tasks.
 * @param {Array<object>} tasks - The array of all task objects.
 * @returns {Array<string>} An array of IDs of tasks on the critical path.
 */
export function calculateCriticalPath(tasks) {
  if (!tasks || tasks.length === 0) {
    return [];
  }

  const tasksMap = new Map(tasks.map(task => [task.id, { ...task }]));

  // Initialize ES, EF, LS, LF, and predecessors/successors lists
  tasks.forEach(task => {
    task.computedDuration = getDurationInDays(task.startDate, task.endDate); // Store original duration
    task.successors = []; // Tasks that depend on this task
    task.predecessors = []; // Tasks this task depends on (for easier lookup)
    // These will be relative day numbers from project start for calculation simplicity
    task.es = 0;
    task.ef = 0;
    task.ls = Infinity;
    task.lf = Infinity;
  });

  // Build predecessor and successor lists and find project start date
  let projectStartDate = new Date(tasks[0].startDate);
  tasks.forEach(task => {
    if (new Date(task.startDate) < projectStartDate) {
      projectStartDate = new Date(task.startDate);
    }
    if (task.dependencies) {
      task.dependencies.forEach(dep => {
        const predecessor = tasksMap.get(dep.predecessorId);
        if (predecessor) {
          predecessor.successors.push({ successorId: task.id, type: dep.type, lag: dep.lag || 0 });
          task.predecessors.push({ predecessorId: predecessor.id, type: dep.type, lag: dep.lag || 0 });
        }
      });
    }
  });
  
  // Normalize projectStartDate to the start of the day
  projectStartDate.setHours(0,0,0,0);

  // Forward Pass: Calculate Early Start (ES) and Early Finish (EF)
  // Convert task start/end dates to day numbers relative to projectStartDate for calculations
  const taskQueue = tasks.filter(task => task.predecessors.length === 0);
  const processedForward = new Set();

  // Initialize ES for tasks with no predecessors
  taskQueue.forEach(task => {
    const taskStart = new Date(task.startDate);
    taskStart.setHours(0,0,0,0);
    task.es = Math.ceil((taskStart - projectStartDate) / (1000 * 60 * 60 * 24));
    task.ef = task.es + task.computedDuration -1; // EF is inclusive
  });
  
  let head = 0;
  while(head < taskQueue.length) {
      const currentTask = taskQueue[head++];
      if (processedForward.has(currentTask.id)) continue;
      processedForward.add(currentTask.id);

      currentTask.ef = currentTask.es + currentTask.computedDuration -1;

      currentTask.successors.forEach(succLink => {
          const successor = tasksMap.get(succLink.successorId);
          if (!successor) return;

          let newSuccessorES = 0;
          const lagDays = succLink.lag || 0;

          switch (succLink.type) {
              case 'FS': // Finish to Start
                  newSuccessorES = currentTask.ef + 1 + lagDays;
                  break;
              case 'SS': // Start to Start
                  newSuccessorES = currentTask.es + lagDays;
                  break;
              // FF and SF require thinking about how they push the *start* of the successor
              // For simplicity in ES/EF pass, we often convert these or use FS/SS as primary drivers for ES.
              // A full CPM handles this by ensuring EF of successor meets FF, or ES of predecessor meets SF.
              // Let's assume FS and SS are primary drivers for ES for now.
              // A more robust calculation would be more complex here.
              // For this pass, we'll use the max possible ES from all predecessors.
              default: // Default to FS for other types in forward pass for simplicity
                  newSuccessorES = currentTask.ef + 1 + lagDays;
                  break;
          }
          
          if (newSuccessorES > successor.es) {
              successor.es = newSuccessorES;
          }

          // Add successor to queue if not already processed and all its predecessors affecting ES are processed
          // This basic queueing might need refinement for complex graphs (e.g., Kahn's algorithm for topological sort)
          if (!taskQueue.find(t => t.id === successor.id) && !processedForward.has(successor.id)) {
             taskQueue.push(successor);
          }
      });
  }
  
  // Update EFs based on final ES values after processing all paths
  tasks.forEach(task => {
      task.ef = task.es + task.computedDuration -1;
  });


  // Backward Pass: Calculate Late Start (LS) and Late Finish (LF)
  let projectEndDateEF = 0;
  tasks.forEach(task => {
    if (task.ef > projectEndDateEF) {
      projectEndDateEF = task.ef;
    }
  });

  const processedBackward = new Set();
  const backwardQueue = tasks.filter(task => task.successors.length === 0);
  
  backwardQueue.forEach(task => {
    task.lf = projectEndDateEF; // Last tasks finish at project end (or their own EF if earlier)
    task.ls = task.lf - task.computedDuration + 1;
  });

  head = 0;
  while(head < backwardQueue.length) {
      const currentTask = backwardQueue[head++];
      if (processedBackward.has(currentTask.id)) continue;
      processedBackward.add(currentTask.id);

      currentTask.ls = currentTask.lf - currentTask.computedDuration + 1;

      currentTask.predecessors.forEach(predLink => {
          const predecessor = tasksMap.get(predLink.predecessorId);
          if (!predecessor) return;

          let newPredecessorLF = 0;
          const lagDays = predLink.lag || 0;

          switch (predLink.type) {
              case 'FS': // Finish to Start
                  newPredecessorLF = currentTask.ls - 1 - lagDays;
                  break;
              case 'SS': // Start to Start
                  // LF_pred = LS_succ - Lag_ss + Dur_pred -1
                  newPredecessorLF = currentTask.ls - lagDays + predecessor.computedDuration -1;
                  break;
              // FF and SF are more complex for LF calc of predecessor
              // LF_pred = LF_succ - Lag_ff
              // LS_pred = LF_pred - Dur_pred + 1
              case 'FF':
                  newPredecessorLF = currentTask.lf - lagDays;
                  break;
              // LS_pred = LS_succ - Dur_succ + Lag_sf (This isn't quite right for pred LF)
              // LF_pred = LS_succ - lag - 1 (if SF means pred must finish before succ starts after lag)
              default: // Default to FS-like logic for backward pass simplicity
                  newPredecessorLF = currentTask.ls - 1 - lagDays;
                  break;
          }

          if (newPredecessorLF < predecessor.lf) {
              predecessor.lf = newPredecessorLF;
          }
          
          if (!backwardQueue.find(t => t.id === predecessor.id) && !processedBackward.has(predecessor.id)) {
              backwardQueue.push(predecessor);
          }
      });
  }
  
  // Update LS based on final LF values
  tasks.forEach(task => {
      task.ls = task.lf - task.computedDuration + 1;
  });


  // Calculate Slack and Identify Critical Path
  const criticalPathTaskIds = [];
  tasks.forEach(task => {
    task.slack = task.ls - task.es; // Or task.lf - task.ef
    if (task.slack <= 0) { // Tasks with zero or negative slack are critical
      criticalPathTaskIds.push(task.id);
    }
    // console.log(`Task: ${task.name}, ES: ${task.es}, EF: ${task.ef}, LS: ${task.ls}, LF: ${task.lf}, Slack: ${task.slack}, Duration: ${task.computedDuration}`);
  });
  
  // Filter critical path to include only connected tasks from start to end
  // This is a simplified approach; a full critical path would trace the zero-slack path.
  // For now, any task with zero slack is considered part of "a" critical path.
  
  return criticalPathTaskIds;
}
