import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const TaskForm = ({ onSubmit, onCancel, initialTaskData, allTasks, allUsers, customFieldDefinitions, isEditing = false }) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [parentId, setParentId] = useState(null);
  const [assigneeId, setAssigneeId] = useState(null);
  const [currentDependencies, setCurrentDependencies] = useState([]);
  const [customFieldValues, setCustomFieldValues] = useState({}); // { fieldId: value }

  useEffect(() => {
    if (initialTaskData) {
      setName(initialTaskData.name || '');
      setStartDate(initialTaskData.startDate ? new Date(initialTaskData.startDate).toISOString().split('T')[0] : '');
      setEndDate(initialTaskData.endDate ? new Date(initialTaskData.endDate).toISOString().split('T')[0] : '');
      setParentId(initialTaskData.parentId || null);
      setAssigneeId(initialTaskData.assigneeId || null);
      setCurrentDependencies(initialTaskData.dependencies ? JSON.parse(JSON.stringify(initialTaskData.dependencies)) : []);
      setCustomFieldValues(initialTaskData.customFields ? JSON.parse(JSON.stringify(initialTaskData.customFields)) : {});
    } else {
      // Defaults for new task
      setName('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setParentId(null);
      setAssigneeId(null);
      setCurrentDependencies([]);
      setCustomFieldValues({}); // Initialize empty for new tasks
    }
  }, [initialTaskData]);

  const handleAddDependency = () => {
    setCurrentDependencies([
      ...currentDependencies,
      { predecessorId: '', type: 'FS', lag: 0 } // Default new dependency
    ]);
  };

  const handleRemoveDependency = (index) => {
    const newDependencies = [...currentDependencies];
    newDependencies.splice(index, 1);
    setCurrentDependencies(newDependencies);
  };

  const handleDependencyChange = (index, field, value) => {
    const newDependencies = [...currentDependencies];
    const dependency = { ...newDependencies[index] }; // Create a new object for the specific dependency
    if (field === 'lag') {
      dependency[field] = parseInt(value, 10) || 0; // Ensure lag is a number
    } else {
      dependency[field] = value;
    }
    newDependencies[index] = dependency;
    setCurrentDependencies(newDependencies);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) {
      alert('Please fill in Name, Start Date, and End Date.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      alert('Start Date cannot be after End Date.');
      return;
    }

    const taskData = {
      name,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      parentId: parentId === 'null' || parentId === '' ? null : parentId,
      assigneeId: assigneeId === 'null' || assigneeId === '' ? null : assigneeId,
      dependencies: currentDependencies.filter(dep => dep.predecessorId),
      customFields: { ...customFieldValues }, // Pass a copy of custom field values
    };
    onSubmit(taskData);
  };

  const handleCustomFieldChange = (fieldId, value, type) => {
    let processedValue = value;
    if (type === 'checkbox') {
      processedValue = !customFieldValues[fieldId]; // Toggle boolean value
    } else if (type === 'number') {
      processedValue = value === '' ? null : parseFloat(value); // Store numbers as numbers, or null if empty
    } else if (type === 'date') {
      processedValue = value === '' ? null : new Date(value).toISOString(); // Store dates as ISO strings, or null if empty
    }

    setCustomFieldValues(prevValues => ({
      ...prevValues,
      [fieldId]: processedValue,
    }));
  };

  // Filter out the current task and its descendants from parent selection options during editing
  const getParentOptions = () => {
    if (!allTasks) return [];
    let availableTasks = allTasks;
    if (isEditing && initialTaskData) {
      const descendantIds = getAllDescendantIds(initialTaskData.id, allTasks);
      availableTasks = allTasks.filter(task => task.id !== initialTaskData.id && !descendantIds.includes(task.id));
    }
    return availableTasks;
  };
  
  // Helper to get all descendant IDs (to prevent circular dependencies)
  const getAllDescendantIds = (taskId, tasks) => {
    let descendants = [];
    const children = tasks.filter(t => t.parentId === taskId);
    for (const child of children) {
      descendants.push(child.id);
      descendants = descendants.concat(getAllDescendantIds(child.id, tasks));
    }
    return descendants;
  };


  return (
    <form onSubmit={handleSubmit} className="modal-form">
      <div>
        <label htmlFor="task-name">Task Name:</label>
        <input
          id="task-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="start-date">Start Date:</label>
        <input
          id="start-date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="end-date">End Date:</label>
        <input
          id="end-date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="parent-task">Parent Task:</label>
        <select
          id="parent-task"
          value={parentId || 'null'}
          onChange={(e) => setParentId(e.target.value === 'null' ? null : e.target.value)}
        >
          <option value="null">None (Top-Level Task)</option>
          {getParentOptions().map(task => (
            <option key={task.id} value={task.id}>
              {task.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="assignee-id">Assignee:</label>
        <select
          id="assignee-id"
          value={assigneeId || 'null'}
          onChange={(e) => setAssigneeId(e.target.value === 'null' ? null : e.target.value)}
        >
          <option value="null">Unassigned</option>
          {allUsers && allUsers.map(user => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="dependencies">Dependencies:</label>
        {currentDependencies.map((dep, index) => (
          <div key={index} className="dependency-item">
            <select
              value={dep.predecessorId}
              onChange={(e) => handleDependencyChange(index, 'predecessorId', e.target.value)}
            >
              <option value="">Select Predecessor...</option>
              {allTasks
                .filter(task => task.id !== (initialTaskData && initialTaskData.id)) // Prevent self-dependency
                .map(task => (
                  <option key={task.id} value={task.id}>{task.name}</option>
                ))}
            </select>
            <select
              value={dep.type}
              onChange={(e) => handleDependencyChange(index, 'type', e.target.value)}
            >
              <option value="FS">Finish to Start (FS)</option>
              <option value="SS">Start to Start (SS)</option>
              <option value="FF">Finish to Finish (FF)</option>
              <option value="SF">Start to Finish (SF)</option>
            </select>
            <input
              type="number"
              value={dep.lag}
              onChange={(e) => handleDependencyChange(index, 'lag', e.target.value)}
              placeholder="Lag (days)"
              className="lag-input"
            />
            <button type="button" onClick={() => handleRemoveDependency(index)} className="remove-dependency-btn">Remove</button>
          </div>
        ))}
        <button type="button" onClick={handleAddDependency} className="add-dependency-btn">
          + Add Dependency
        </button>
      </div>
      
      {/* Custom Fields Section */}
      {customFieldDefinitions && customFieldDefinitions.length > 0 && (
        <div className="custom-fields-form-section">
          <h4>Custom Fields:</h4>
          {customFieldDefinitions.map(def => (
            <div key={def.id} className="form-field-group">
              <label htmlFor={`custom-field-${def.id}`}>{def.name}:</label>
              {def.type === 'text' && (
                <input type="text" id={`custom-field-${def.id}`} value={customFieldValues[def.id] || ''} onChange={e => handleCustomFieldChange(def.id, e.target.value, def.type)} />
              )}
              {def.type === 'textarea' && (
                <textarea id={`custom-field-${def.id}`} value={customFieldValues[def.id] || ''} onChange={e => handleCustomFieldChange(def.id, e.target.value, def.type)} />
              )}
              {def.type === 'number' && (
                <input type="number" id={`custom-field-${def.id}`} value={customFieldValues[def.id] == null ? '' : customFieldValues[def.id]} onChange={e => handleCustomFieldChange(def.id, e.target.value, def.type)} />
              )}
              {def.type === 'date' && (
                <input type="date" id={`custom-field-${def.id}`} value={customFieldValues[def.id] ? new Date(customFieldValues[def.id]).toISOString().split('T')[0] : ''} onChange={e => handleCustomFieldChange(def.id, e.target.value, def.type)} />
              )}
              {def.type === 'dropdown' && (
                <select id={`custom-field-${def.id}`} value={customFieldValues[def.id] || ''} onChange={e => handleCustomFieldChange(def.id, e.target.value, def.type)}>
                  <option value="">Select {def.name}...</option>
                  {def.options.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              )}
              {def.type === 'checkbox' && (
                <input type="checkbox" className="custom-field-checkbox" id={`custom-field-${def.id}`} checked={!!customFieldValues[def.id]} onChange={e => handleCustomFieldChange(def.id, e.target.checked, def.type)} />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="form-actions">
        <button type="submit" className="primary">{isEditing ? 'Save Changes' : 'Create Task'}</button>
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

TaskForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  initialTaskData: PropTypes.object,
  allTasks: PropTypes.arrayOf(PropTypes.object).isRequired,
  allUsers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  })).isRequired,
  customFieldDefinitions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(PropTypes.string),
  })), // Not required, can be empty array
  isEditing: PropTypes.bool,
};

TaskForm.defaultProps = {
  customFieldDefinitions: [], // Default to empty array if not provided
};

export default TaskForm;
