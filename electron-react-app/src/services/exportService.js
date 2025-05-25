import Papa from 'papaparse';

// Check if running in Electron renderer process to use ipcRenderer
const isElectron = !!window.require; // A common way to check for Electron's require
let ipcRenderer = null;
if (isElectron) {
  ipcRenderer = window.require('electron').ipcRenderer;
}

/**
 * Triggers a file download through the main process.
 * @param {string} channel - The IPC channel to send the data on.
 * @param {string} defaultFilename - The suggested filename for the save dialog.
 * @param {string} data - The data content to save.
 * @param {string} fileType - 'JSON' or 'CSV' for dialog filters.
 */
function triggerDownload(channel, defaultFilename, data, fileType) {
  if (!ipcRenderer) {
    console.error("IPC Renderer not available. Export functionality is limited to browser download.");
    // Fallback for browser environment (though not the primary target for this app)
    const blob = new Blob([data], { type: fileType === 'JSON' ? 'application/json' : 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', defaultFilename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    return;
  }

  ipcRenderer.send(channel, { defaultFilename, data, fileType });
}

/**
 * Prepares project data and triggers a JSON export.
 * @param {Array<object>} tasks - Array of task objects.
 * @param {Array<object>} users - Array of user objects.
 * @param {Array<object>} customFieldDefinitions - Array of custom field definition objects.
 */
export const exportProjectAsJSON = (tasks, users, customFieldDefinitions) => {
  const projectData = {
    tasks,
    users,
    customFieldDefinitions,
    exportDate: new Date().toISOString(),
  };
  const jsonData = JSON.stringify(projectData, null, 2); // Pretty print JSON
  triggerDownload('handle-export-json', 'project-export.json', jsonData, 'JSON');
};

/**
 * Calculates duration in days (inclusive of start and end date).
 */
function getTaskDurationForExport(startDateStr, endDateStr) {
    if (!startDateStr || !endDateStr) return '';
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
}

/**
 * Prepares task data and triggers a CSV export.
 * @param {Array<object>} tasks - Array of task objects.
 * @param {Array<object>} users - Array of user objects.
 * @param {Array<object>} customFieldDefinitions - Array of custom field definition objects.
 */
export const exportProjectAsCSV = (tasks, users, customFieldDefinitions) => {
  const usersMap = new Map(users.map(user => [user.id, user.name]));
  const customFieldDefMap = new Map(customFieldDefinitions.map(def => [def.id, def.name]));

  const tasksForCSV = tasks.map(task => {
    const taskData = {
      'Task ID': task.id,
      'Task Name': task.name,
      'Start Date': task.startDate ? new Date(task.startDate).toLocaleDateString() : '',
      'End Date': task.endDate ? new Date(task.endDate).toLocaleDateString() : '',
      'Duration (Days)': getTaskDurationForExport(task.startDate, task.endDate),
      'Status': task.status,
      'Assignee Name': task.assigneeId ? usersMap.get(task.assigneeId) || task.assigneeId : '',
      'Parent ID': task.parentId || '',
      'Progress (%)': task.progress,
      'Is Milestone': task.isMilestone ? 'Yes' : 'No',
      'Dependencies': task.dependencies ? task.dependencies.map(d => `${d.predecessorId} (${d.type}${d.lag ? ' L'+d.lag : ''})`).join('; ') : '',
    };

    // Add custom field values
    customFieldDefinitions.forEach(def => {
      const header = `Custom: ${customFieldDefMap.get(def.id) || def.id}`;
      let value = task.customFields ? task.customFields[def.id] : '';
      if (value === undefined || value === null) value = '';
      if (def.type === 'checkbox') value = value ? 'Yes' : 'No';
      if (def.type === 'date' && value) value = new Date(value).toLocaleDateString();
      taskData[header] = value;
    });
    return taskData;
  });

  if (tasksForCSV.length === 0) {
    alert("No tasks to export.");
    return;
  }
  
  const csvData = Papa.unparse(tasksForCSV);
  triggerDownload('handle-export-csv', 'project-tasks-export.csv', csvData, 'CSV');
};
