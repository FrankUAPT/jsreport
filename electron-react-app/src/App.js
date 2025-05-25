import React, { useState, useEffect } from 'react';
import TaskList from './components/TaskList';
import GanttChart from './components/gantt/GanttChart';
import Modal from './components/shared/Modal';
import TaskForm from './components/TaskForm';
import UserManagement from './components/settings/UserManagement';
import CustomFieldsSettings from './components/settings/CustomFieldsSettings'; // Import CustomFieldsSettings
import { createTask } from './data_models/Task';
import { createUser } from './data_models/User';
import { createCustomFieldDefinition } from './data_models/CustomFieldDefinition'; // Import
import { sampleTasks, sampleUsers, usersById as initialUsersByIdFromSample } from './sampleData';
import { 
  loadTasks, saveTasks, 
  loadUsers, saveUsers,
  loadCustomFieldDefinitions, saveCustomFieldDefinitions
} from './services/storageService';
import { exportProjectAsJSON, exportProjectAsCSV } from './services/exportService'; // Import export service
import { rescheduleSuccessors } from './services/schedulingService';
import { calculateCriticalPath } from './services/criticalPathService';
import 'react-contexify/dist/ReactContexify.css';
import './App.css';

// Commenting out electron-store logic for now to focus on task list display
// let Store;
// let store;
// try {
//   Store = require('electron-store');
//   store = new Store();
// } catch (error) {
//   console.warn('electron-store could not be loaded in renderer:', error);
//   store = {
//     get: (key, defaultValue) => `electron-store not available. Mock value for ${key}.`,
//     set: (key, value) => console.warn(`electron-store not available. Cannot set ${key} to ${value}.`)
//   };
// }

function App() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState([]);

  const [ganttViewMode, setGanttViewMode] = useState('Week');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskModalMode, setTaskModalMode] = useState('create');
  
  const [showSettingsView, setShowSettingsView] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('users');
  const [isLoading, setIsLoading] = useState(true);
  const [criticalPathTaskIds, setCriticalPathTaskIds] = useState([]);
  const [showCriticalPath, setShowCriticalPath] = useState(false);

  // View, Filter, Sort, Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssigneeId, setFilterAssigneeId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  // Add more filter states here if implementing custom field filters
  const [sortKey, setSortKey] = useState('startDate'); // Default sort key
  const [sortOrder, setSortOrder] = useState('asc');   // Default sort order
  
  const [displayedTasks, setDisplayedTasks] = useState([]); // Tasks to show in TaskList
  // Initialize theme from localStorage or default to 'light'
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('app-theme');
    return storedTheme || 'light';
  });

  // --- Theme Management ---
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme); // Save theme to localStorage
  }, [theme]);

  // --- Initial Data Loading & Derived State Update ---
  useEffect(() => {
    // Load Tasks
    let loadedTasks = loadTasks();
    let tasksToUse = loadedTasks || sampleTasks;
    
    // Load Users
    let loadedUsers = loadUsers();
    let usersToUse = loadedUsers || sampleUsers;
    const usersByIdMap = usersToUse.reduce((acc, user) => { acc[user.id] = user; return acc; }, {});

    // Load Custom Field Definitions
    let loadedCustomFieldDefs = loadCustomFieldDefinitions();
    let customFieldDefsToUse;
    if (loadedCustomFieldDefs) {
      customFieldDefsToUse = loadedCustomFieldDefs;
    } else {
      // Create sample custom field definitions
      const sampleDef1 = createCustomFieldDefinition("Budget Impact", "dropdown", ["High", "Medium", "Low"]);
      const sampleDef2 = createCustomFieldDefinition("Priority", "dropdown", ["Critical", "High", "Medium", "Low"]);
      customFieldDefsToUse = [sampleDef1, sampleDef2];
      
      // Add sample custom field values to some tasks
      if (tasksToUse === sampleTasks) { // Only if using sample tasks
         const taskToUpdate1Id = sampleTasks.find(t => t.name === "Venue Selection")?.id;
         const taskToUpdate2Id = sampleTasks.find(t => t.name === "Develop Marketing Plan")?.id;
         if (taskToUpdate1Id) {
            const taskIndex = tasksToUse.findIndex(t => t.id === taskToUpdate1Id);
            if (taskIndex !== -1) {
                tasksToUse[taskIndex].customFields = {
                    ...tasksToUse[taskIndex].customFields,
                    [sampleDef1.id]: "High", // Budget Impact: High
                    [sampleDef2.id]: "Critical" // Priority: Critical
                };
            }
         }
         if (taskToUpdate2Id) {
            const taskIndex = tasksToUse.findIndex(t => t.id === taskToUpdate2Id);
             if (taskIndex !== -1) {
                tasksToUse[taskIndex].customFields = {
                    ...tasksToUse[taskIndex].customFields,
                    [sampleDef1.id]: "Medium", // Budget Impact: Medium
                    [sampleDef2.id]: "High"    // Priority: High
                };
            }
         }
      }
      saveCustomFieldDefinitions(customFieldDefsToUse);
    }
    
    setTasks(tasksToUse);
    setUsers(usersToUse);
    setUsersById(usersByIdMap);
    setCustomFieldDefinitions(customFieldDefsToUse);

    if (!loadedTasks) saveTasks(tasksToUse);
    if (!loadedUsers) saveUsers(usersToUse);
    
    setIsLoading(false);
    // Initial calculation of displayedTasks will be handled by another useEffect below
  }, []);

  // This useEffect will recalculate displayedTasks whenever master tasks or view settings change
  useEffect(() => {
    if (isLoading) return; // Don't process until initial data is loaded

    let processedTasks = [...tasks];

    // 1. Apply Search
    if (searchQuery) {
      const lowerSearchQuery = searchQuery.toLowerCase();
      processedTasks = processedTasks.filter(task => 
        task.name.toLowerCase().includes(lowerSearchQuery)
        // Future: Extend search to other fields like description or custom text fields
      );
    }

    // 2. Apply Filters
    if (filterAssigneeId) {
      processedTasks = processedTasks.filter(task => task.assigneeId === filterAssigneeId);
    }
    if (filterStatus) {
      processedTasks = processedTasks.filter(task => task.status === filterStatus);
    }
    // Future: Add custom field filters here

    // 3. Apply Sorting
    if (sortKey) {
      processedTasks.sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];

        if (sortKey === 'assigneeName' && usersById) { // Special handling for assignee name
          valA = usersById[a.assigneeId] ? usersById[a.assigneeId].name : '';
          valB = usersById[b.assigneeId] ? usersById[b.assigneeId].name : '';
        } else if (sortKey === 'startDate' || sortKey === 'endDate') {
          valA = new Date(valA);
          valB = new Date(valB);
        } else if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    // For hierarchy handling (Strategy 1: Filter individuals, display if they match)
    // The current filtering approach already achieves this. If a parent is filtered out,
    // its children (if they match) will still be in processedTasks.
    // TaskList and TaskItem will render them, and they might appear at a higher level
    // if their parent is not in processedTasks. This is acceptable for Strategy 1.
    
    setDisplayedTasks(processedTasks);

  }, [tasks, searchQuery, filterAssigneeId, filterStatus, sortKey, sortOrder, usersById, isLoading]);

  // --- Task Modal Management ---
  const openTaskModal = (mode = 'create', task = null, parentIdForNewSubTask = null) => {
    setTaskModalMode(mode);
    if (mode === 'create' && parentIdForNewSubTask) {
      // For adding a sub-task, we don't have an 'editingTask' but we have a parent.
      // The TaskForm will use initialTaskData to prefill. For a new sub-task,
      // we can pass a minimal object with just the parentId.
      setEditingTask({ parentId: parentIdForNewSubTask }); 
    } else {
      setEditingTask(task);
    }
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  // --- CRUD Operations ---
  // --- Task CRUD Operations ---
  // --- Task CRUD Operations ---
  const handleCreateTask = (taskData) => {
    const newTask = createTask({
      name: taskData.name,
      startDate: new Date(taskData.startDate),
      endDate: new Date(taskData.endDate),
      parentId: taskData.parentId,
      assigneeId: taskData.assigneeId, // Get assigneeId from form
      dependencies: taskData.dependencies || [], // Get dependencies from form
    });

    let currentTasks = [...tasks, newTask];
    if (newTask.parentId) {
      currentTasks = currentTasks.map(task => 
        task.id === newTask.parentId 
        ? { ...task, childrenIds: [...(task.childrenIds || []), newTask.id] } 
        : task
      );
    }
    setTasks(currentTasks);
    saveTasks(currentTasks); // Save to store
    closeTaskModal();
  };

  const handleEditTask = (formData) => {
    if (!editingTask) return;

    const updatedTaskDetails = {
      ...editingTask,
      name: formData.name,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      parentId: formData.parentId,
      assigneeId: formData.assigneeId,
      dependencies: formData.dependencies || [],
    };
    
    let finalTasks;
    setTasks(prevTasks => {
      let newTasks = prevTasks.map(task =>
        task.id === editingTask.id ? { ...updatedTaskDetails } : task
      );
      const oldParentId = editingTask.parentId;
      const newParentId = formData.parentId;
      if (oldParentId !== newParentId) {
        if (oldParentId) newTasks = newTasks.map(t => t.id === oldParentId ? { ...t, childrenIds: t.childrenIds.filter(id => id !== editingTask.id) } : t);
        if (newParentId) newTasks = newTasks.map(t => t.id === newParentId ? { ...t, childrenIds: [...(t.childrenIds || []), editingTask.id] } : t);
      }
      // After basic updates, reschedule successors if dates changed
      if (editingTask.startDate !== updatedTaskDetails.startDate || editingTask.endDate !== updatedTaskDetails.endDate) {
        finalTasks = rescheduleSuccessors(editingTask.id, newTasks);
      } else {
        finalTasks = newTasks;
      }
      return finalTasks;
    });

    if (finalTasks) saveTasks(finalTasks);
    closeTaskModal();
  };
  
  const handleDeleteTask = (taskIdToDelete) => {
    if (!window.confirm("Are you sure you want to delete this task and all its sub-tasks?")) return;
    
    let tasksToDelete = [taskIdToDelete];
    let currentTasks = [...tasks];
    const findDescendants = (parentId) => {
      const children = currentTasks.filter(task => task.parentId === parentId);
      children.forEach(child => { tasksToDelete.push(child.id); findDescendants(child.id); });
    };
    findDescendants(taskIdToDelete);
    
    let updatedTasks = currentTasks.filter(task => !tasksToDelete.includes(task.id));
    
    // Also remove the deleted task from any other tasks' dependency lists
    updatedTasks = updatedTasks.map(task => {
        if (task.dependencies && task.dependencies.some(dep => dep.predecessorId === taskIdToDelete)) {
            return {
                ...task,
                dependencies: task.dependencies.filter(dep => dep.predecessorId !== taskIdToDelete)
            };
        }
        return task;
    });

    const taskToDeleteObj = tasks.find(t => t.id === taskIdToDelete);
    if (taskToDeleteObj && taskToDeleteObj.parentId) {
      updatedTasks = updatedTasks.map(task => task.id === taskToDeleteObj.parentId ? { ...task, childrenIds: task.childrenIds.filter(id => id !== taskIdToDelete) } : task);
    }
    
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  // --- User CRUD Operations ---
  const handleAddUser = (userData) => {
    const newUser = createUser(userData.name, userData.email);
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    setUsersById(prevUsersById => ({ ...prevUsersById, [newUser.id]: newUser }));
    saveUsers(updatedUsers); // Save to store
  };

  const handleEditUser = (updatedUserData) => {
    const updatedUsers = users.map(user =>
      user.id === updatedUserData.id ? { ...user, ...updatedUserData } : user
    );
    setUsers(updatedUsers);
    setUsersById(prevUsersById => ({
      ...prevUsersById,
      [updatedUserData.id]: { ...prevUsersById[updatedUserData.id], ...updatedUserData }
    }));
    saveUsers(updatedUsers); // Save to store
  };

  const handleDeleteUser = (userIdToDelete) => {
    if (!window.confirm("Are you sure you want to delete this user? Tasks assigned to this user will be unassigned.")) return;
    
    const updatedTasks = tasks.map(task =>
      task.assigneeId === userIdToDelete ? { ...task, assigneeId: null } : task
    );
    setTasks(updatedTasks);
    saveTasks(updatedTasks); // Save updated tasks (unassigned)

    const updatedUsers = users.filter(user => user.id !== userIdToDelete);
    setUsers(updatedUsers);
    setUsersById(prevUsersById => {
      const newUsersById = { ...prevUsersById };
      delete newUsersById[userIdToDelete];
      return newUsersById;
    });
    saveUsers(updatedUsers);
  };

  const handleAddSubTask = (parentId) => {
    openTaskModal('create', null, parentId); // Open modal in 'create' mode, no existing task, but pass parentId
  };

  // --- Task Reorder Logic ---
  const handleTaskReorder = (taskId, parentId, newIndex, oldIndex) => {
    setTasks(prevTasks => {
      let reorderedTasks = [...prevTasks];
      
      if (parentId) { // Reordering children of a parent task
        const parentTaskIndex = reorderedTasks.findIndex(t => t.id === parentId);
        if (parentTaskIndex === -1) return prevTasks; // Parent not found

        const parentTask = { ...reorderedTasks[parentTaskIndex] };
        let childrenIds = [...(parentTask.childrenIds || [])];
        
        const [movedTaskId] = childrenIds.splice(oldIndex, 1);
        childrenIds.splice(newIndex, 0, movedTaskId);
        
        parentTask.childrenIds = childrenIds;
        reorderedTasks[parentTaskIndex] = parentTask;

      } else { // Reordering top-level tasks
        // Get current top-level tasks in their visual order
        let topLevelTasks = reorderedTasks.filter(t => !t.parentId);
        
        // To ensure consistent reordering, we need to map the visual order (from childrenIds of a virtual root or similar)
        // For simplicity here, we'll find the task by ID and reorder the filtered list.
        // This assumes `topLevelTasks` in TaskList.js is derived similarly.
        // A more robust way for top-level tasks would be to have a root "project" task or maintain a specific order array.
        // For now, we reorder the filtered list and then reconstruct `reorderedTasks`
        // This is NOT robust if top-level tasks are not contiguous in the main `tasks` array or if their order matters beyond visual.
        // A better approach for top-level would be to sort them based on some persistent order field, or manage a root childrenIds.
        // Given the current structure, we will reorder `childrenIds` of the effective "null" parent.
        
        // Let's assume our current `tasks` array order for top-level tasks is what we are reordering.
        // This part is tricky without a dedicated order field or a root task.
        // The `childrenIds` approach for parents is cleaner.
        // For top-level, we will filter, reorder, then merge back.
        
        const itemsToReorder = topLevelTasks; // Use the already filtered and potentially sorted list
        const [movedItem] = itemsToReorder.splice(oldIndex, 1);
        itemsToReorder.splice(newIndex, 0, movedItem);

        // Now, reconstruct the main tasks array, placing reordered top-level tasks first,
        // followed by all child tasks (whose relative order to their parents is maintained).
        const nonTopLevelTasks = reorderedTasks.filter(t => t.parentId);
        reorderedTasks = [...itemsToReorder, ...nonTopLevelTasks];
      }
      
      saveTasks(reorderedTasks);
      return reorderedTasks;
    });
  };


  // --- Custom Field Definition CRUD Operations ---
  const handleAddCustomFieldDefinition = (definitionData) => {
    const newDefinition = createCustomFieldDefinition(
      definitionData.name,
      definitionData.type,
      definitionData.options
    );
    const updatedDefinitions = [...customFieldDefinitions, newDefinition];
    setCustomFieldDefinitions(updatedDefinitions);
    saveCustomFieldDefinitions(updatedDefinitions);
  };

  const handleEditCustomFieldDefinition = (updatedDefinitionData) => {
    const updatedDefinitions = customFieldDefinitions.map(def =>
      def.id === updatedDefinitionData.id ? { ...def, ...updatedDefinitionData } : def
    );
    setCustomFieldDefinitions(updatedDefinitions);
    saveCustomFieldDefinitions(updatedDefinitions);
  };

  const handleDeleteCustomFieldDefinition = (definitionIdToDelete) => {
    if (!window.confirm("Are you sure you want to delete this custom field definition? This will remove associated custom field values from all tasks.")) {
      return;
    }
    // Remove custom field values from all tasks
    const updatedTasks = tasks.map(task => {
      if (task.customFields && task.customFields.hasOwnProperty(definitionIdToDelete)) {
        const newCustomFields = { ...task.customFields };
        delete newCustomFields[definitionIdToDelete];
        return { ...task, customFields: newCustomFields };
      }
      return task;
    });
    setTasks(updatedTasks);
    saveTasks(updatedTasks); // Save tasks with removed custom field values

    // Delete the definition itself
    const updatedDefinitions = customFieldDefinitions.filter(def => def.id !== definitionIdToDelete);
    setCustomFieldDefinitions(updatedDefinitions);
    saveCustomFieldDefinitions(updatedDefinitions);
  };

  // --- Gantt Interaction Handlers ---
  const handleGanttTaskDateUpdate = (taskId, newStartDate, newEndDate) => {
    let finalTasks;
    setTasks(prevTasks => {
      let updatedTasks = prevTasks.map(task =>
        task.id === taskId
          ? { ...task, startDate: newStartDate, endDate: newEndDate }
          : task
      );
      // After Gantt update, reschedule successors
      finalTasks = rescheduleSuccessors(taskId, updatedTasks);
      return finalTasks;
    });
    if (finalTasks) saveTasks(finalTasks);
    console.log(`Task ${taskId} dates updated by Gantt: Start: ${newStartDate}, End: ${newEndDate}. Rescheduling triggered.`);
  };

  const handleGanttTaskProgressUpdate = (taskId, newProgress) => {
    let currentTasks;
    setTasks(prevTasks => {
      currentTasks = prevTasks.map(task =>
        task.id === taskId ? { ...task, progress: newProgress } : task
      );
      return currentTasks;
    });
    if (currentTasks) {
        saveTasks(currentTasks);
        if (showCriticalPath) { // Recalculate critical path if shown and tasks change
            setCriticalPathTaskIds(calculateCriticalPath(currentTasks));
        }
    }
    console.log(`Task ${taskId} progress updated by Gantt: ${newProgress}%`);
  };

  const toggleCriticalPath = () => {
    const newShowCriticalPath = !showCriticalPath;
    setShowCriticalPath(newShowCriticalPath);
    if (newShowCriticalPath && !isLoading) { // Ensure tasks are loaded
      setCriticalPathTaskIds(calculateCriticalPath(tasks));
    } else {
      setCriticalPathTaskIds([]);
    }
  };

  // Note: The useEffect for recalculating critical path on [tasks, showCriticalPath, isLoading] changes
  // already handles updates correctly.


  if (isLoading) {
    return <div className="loading-screen">Loading data...</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Project Management Tool</h1>
        <div className="app-controls">
          {!showSettingsView && (
            <button onClick={() => openTaskModal('create')} className="new-task-btn">New Task</button>
          )}
          <button onClick={() => { setShowSettingsView(!showSettingsView); setActiveSettingsTab('users'); }} className="settings-btn">
            {showSettingsView ? 'Back to Tasks' : 'Settings'}
          </button>
          {/* Add the new Toggle Theme button here */}
          <button onClick={toggleTheme} className="settings-btn theme-toggle-btn">
            {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          </button>
          {!showSettingsView && (
            <>
              <button onClick={toggleCriticalPath} className="critical-path-btn">
                {showCriticalPath ? "Hide Critical Path" : "Highlight Critical Path"}
              </button>
              <div className="view-mode-controls">
                <button onClick={() => setGanttViewMode('Day')}>Day View</button>
                <button onClick={() => setGanttViewMode('Week')}>Week View</button>
                <button onClick={() => setGanttViewMode('Month')}>Month View</button>
              </div>
            </>
          )}
        </div>
      </header>

      {showSettingsView ? (
        <main className="App-main-settings">
          <div className="settings-tabs">
            <button 
              onClick={() => setActiveSettingsTab('users')} 
              className={activeSettingsTab === 'users' ? 'active' : ''}
            >User Management</button>
            <button 
              onClick={() => setActiveSettingsTab('customFields')}
              className={activeSettingsTab === 'customFields' ? 'active' : ''}
            >Custom Fields</button>
          </div>
          {activeSettingsTab === 'users' && (
            <UserManagement 
              users={users}
              onAddUser={handleAddUser}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
            />
          )}
          {activeSettingsTab === 'customFields' && (
            <CustomFieldsSettings
              definitions={customFieldDefinitions}
              onAddDefinition={handleAddCustomFieldDefinition}
              onEditDefinition={handleEditCustomFieldDefinition}
              onDeleteDefinition={handleDeleteCustomFieldDefinition}
            />
          )}
          {/* Export Buttons Section - visible regardless of active tab, but only in settings view */}
          <div className="export-controls-section">
            <h3>Export Project Data</h3>
            <button 
              onClick={() => exportProjectAsJSON(tasks, users, customFieldDefinitions)}
              className="export-btn json-export-btn"
            >
              Export as JSON
            </button>
            <button 
              onClick={() => exportProjectAsCSV(tasks, users, customFieldDefinitions)}
              className="export-btn csv-export-btn"
            >
              Export Tasks as CSV
            </button>
          </div>
        </main>
      ) : (
        <main className="App-main-grid">
          <div className="task-list-view">
            {/* TaskList now receives displayedTasks */}
            <TaskList 
              tasks={displayedTasks} 
              users={users} // For filter dropdown
              usersById={usersById}
              customFieldDefinitions={customFieldDefinitions}
              filterAssigneeId={filterAssigneeId}
              setFilterAssigneeId={setFilterAssigneeId}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              sortKey={sortKey}
              setSortKey={setSortKey}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onEditTask={(task) => openTaskModal('edit', task)}
              onDeleteTask={handleDeleteTask}
              onAddSubTask={handleAddSubTask}
              onTaskReorder={handleTaskReorder}
            />
          </div>
          <div className="gantt-chart-view">
            {/* GanttChart should probably also display filtered/searched tasks if desired, or always all tasks.
                For now, let's pass all tasks to Gantt, as filtering Gantt can be complex with dependencies.
                Alternatively, pass displayedTasks if Gantt should reflect the filter.
                Let's pass displayedTasks for consistency in view, but acknowledge limitations.
            */}
            {displayedTasks && displayedTasks.length > 0 ? (
              <GanttChart 
                tasks={displayedTasks} // Display filtered/sorted tasks in Gantt too
                viewMode={ganttViewMode}
                criticalPathTaskIds={criticalPathTaskIds} // Pass critical path IDs
                onTaskDateChange={handleGanttTaskDateUpdate}
                onTaskProgressChange={handleGanttTaskProgressUpdate}
              />
            ) : (
              <p>No tasks to display in Gantt chart.</p>
            )}
          </div>
        </main>
      )}

      {isTaskModalOpen && (
        <Modal 
            isOpen={isTaskModalOpen} 
            onClose={closeTaskModal} 
            title={taskModalMode === 'edit' ? 'Edit Task' : 'Create New Task'}
        >
          <TaskForm
            onSubmit={taskModalMode === 'edit' ? handleEditTask : handleCreateTask}
            onCancel={closeTaskModal}
            initialTaskData={editingTask}
            allTasks={tasks}
            allUsers={users}
            customFieldDefinitions={customFieldDefinitions} // Pass definitions for form rendering
            isEditing={modalMode === 'edit'}
          />
        </Modal>
      )}
    </div>
  );
}

export default App;
