import React from 'react';
import PropTypes from 'prop-types';
import TaskItem from './TaskItem';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import './TaskList.css'; // Create and import CSS for TaskList controls

const TaskList = ({ 
  tasks, // This will be displayedTasks from App.js
  users, // All users for assignee filter dropdown
  usersById, 
  customFieldDefinitions, 
  filterAssigneeId, setFilterAssigneeId,
  filterStatus, setFilterStatus,
  sortKey, setSortKey,
  sortOrder, setSortOrder,
  searchQuery, setSearchQuery,
  onEditTask, 
  onDeleteTask, 
  onAddSubTask, 
  onTaskReorder 
}) => {
  // topLevelTasks will be derived from the 'tasks' prop (which is already filtered/sorted displayedTasks)
  const topLevelTasks = tasks.filter(task => !task.parentId);

  const availableStatuses = ["To Do", "In Progress", "Done", "On Hold", "Cancelled"]; // Example statuses
  const sortableKeys = [
    { value: 'name', label: 'Name' },
    { value: 'startDate', label: 'Start Date' },
    { value: 'endDate', label: 'End Date' },
    { value: 'status', label: 'Status' },
    { value: 'progress', label: 'Progress' },
    { value: 'assigneeName', label: 'Assignee' } // Special key for sorting by assignee name
  ];

  // Sort top-level tasks by their order property if it exists, or by name/id as fallback
  // For this implementation, we need a consistent order, which will be managed by App.js
  // For now, let's assume tasks arrive pre-sorted or we sort them based on a dedicated order field
  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || source.droppableId !== destination.droppableId) return;
    const parentId = source.droppableId === 'top-level-droppable' ? null : source.droppableId;
    onTaskReorder(draggableId, parentId, destination.index, source.index);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterAssigneeId('');
    setFilterStatus('');
    setSortKey('startDate'); // Reset to default sort
    setSortOrder('asc');
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="task-list-container">
        <div className="task-list-controls">
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="task-search-input"
          />
          <div className="filter-sort-controls">
            <select value={filterAssigneeId} onChange={(e) => setFilterAssigneeId(e.target.value)}>
              <option value="">Filter by Assignee...</option>
              {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">Filter by Status...</option>
              {availableStatuses.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
              <option value="">Sort by...</option>
              {sortableKeys.map(key => <option key={key.value} value={key.value}>{key.label}</option>)}
            </select>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} disabled={!sortKey}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
            <button onClick={clearFilters} className="clear-filters-btn">Clear All</button>
          </div>
        </div>
        
        <h2>Task List {tasks.length === 0 && searchQuery === '' && filterAssigneeId === '' && filterStatus === '' ? "(No tasks)" : `(${tasks.length} matching)`}</h2>

        {tasks.length === 0 ? (
          <p>No tasks match your current filters or search query.</p>
        ) : (
          <Droppable droppableId="top-level-droppable" type="TASK">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                style={{ 
                  background: snapshot.isDraggingOver ? 'lightblue' : 'transparent',
                  paddingBottom: '10px'
                }}
              >
                {topLevelTasks.map((task, index) => (
                  <TaskItem 
                    key={task.id} 
                    task={task}
                    index={index}
                    allTasks={tasks} // Pass displayedTasks as allTasks for children lookup
                    usersById={usersById}
                    customFieldDefinitions={customFieldDefinitions}
                    level={0} 
                    onEditTask={onEditTask}
                    onDeleteTask={onDeleteTask}
                    onAddSubTask={onAddSubTask}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}
    </div>
  );
};

TaskList.propTypes = {
  tasks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      parentId: PropTypes.string, // Can be null or undefined
      startDate: PropTypes.string, // Assuming ISO string
      endDate: PropTypes.string, // Assuming ISO string
      assigneeId: PropTypes.string,
      status: PropTypes.string,
      progress: PropTypes.number,
      dependencies: PropTypes.array, // Could be more specific if structure is fixed
      childrenIds: PropTypes.arrayOf(PropTypes.string),
      customFields: PropTypes.object,
    })
  ).isRequired,
  users: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      // email: PropTypes.string, // Optional, if needed by TaskList directly
    })
  ).isRequired,
  usersById: PropTypes.objectOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  customFieldDefinitions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      // options: PropTypes.array, // If type is 'dropdown'
    })
  ).isRequired,
  filterAssigneeId: PropTypes.string.isRequired,
  setFilterAssigneeId: PropTypes.func.isRequired,
  filterStatus: PropTypes.string.isRequired,
  setFilterStatus: PropTypes.func.isRequired,
  sortKey: PropTypes.string.isRequired,
  setSortKey: PropTypes.func.isRequired,
  sortOrder: PropTypes.string.isRequired,
  setSortOrder: PropTypes.func.isRequired,
  searchQuery: PropTypes.string.isRequired,
  setSearchQuery: PropTypes.func.isRequired,
  onEditTask: PropTypes.func.isRequired,
  onDeleteTask: PropTypes.func.isRequired,
  onAddSubTask: PropTypes.func.isRequired,
  onTaskReorder: PropTypes.func.isRequired,
};

export default TaskList;
