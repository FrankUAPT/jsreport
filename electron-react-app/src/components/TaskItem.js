import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { Menu, Item, useContextMenu, theme as contexifyTheme, animation as contexifyAnimation } from 'react-contexify';

const TASK_ITEM_MENU_ID = "taskItemMenu";

const TaskItem = ({ task, index, allTasks, usersById, customFieldDefinitions, level = 0, onEditTask, onDeleteTask, onAddSubTask }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { show } = useContextMenu({
    id: TASK_ITEM_MENU_ID,
  });

  function handleContextMenu(event) {
    event.preventDefault();
    show({
      event,
      props: {
        task, // Pass task data to menu item handlers
      }
    });
  }

  // Find child tasks
  // Children can be found either via task.childrenIds (if pre-populated)
  // or by filtering allTasks for items whose parentId matches the current task's id.
  // For this implementation, we'll rely on task.childrenIds if available and populated,
  // otherwise, filter allTasks. The sampleData.js populates childrenIds.
  const children = task.childrenIds && task.childrenIds.length > 0
    ? task.childrenIds.map(childId => allTasks.find(t => t.id === childId)).filter(Boolean) // Filter out undefined if any ID is not found
    : allTasks.filter(t => t.parentId === task.id);

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const taskStyle = {
    paddingLeft: `${level * 20}px`,
    marginBottom: '8px', // Consistent margin
    borderLeft: level > 0 ? '2px solid #eee' : 'none',
    background: 'white', // Ensure items have a background for dragging appearance
    borderRadius: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  };

  const taskNameStyle = {
    fontWeight: task.isMilestone ? 'bold' : 'normal',
  };

  const taskActionsStyle = {
    marginLeft: '10px',
    display: 'inline-block',
  };

  const buttonStyle = {
    marginLeft: '5px',
    padding: '2px 6px',
    fontSize: '0.8em',
    cursor: 'pointer',
    border: '1px solid #ccc',
    borderRadius: '3px',
  };

  const editButtonStyle = { ...buttonStyle, backgroundColor: '#f0f0f0' };
  const deleteButtonStyle = { ...buttonStyle, backgroundColor: '#ffdddd' };

  // Children are determined by task.childrenIds and fetched from allTasks
  // This is the second declaration of 'children', targeted for rename.
  const childTasks = task.childrenIds
    ? task.childrenIds.map(childId => allTasks.find(t => t.id === childId)).filter(Boolean)
    : [];

  return (
    <>
      <Draggable draggableId={task.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            style={{
              ...taskStyle,
              ...provided.draggableProps.style,
              border: snapshot.isDragging ? '2px solid #007bff' : taskStyle.borderLeft,
            }}
            onContextMenu={handleContextMenu} // Attach context menu handler
          >
            {/* Task Item Header - includes drag handle */}
            <div className="task-item-header" {...provided.dragHandleProps} style={{ display: 'flex', alignItems: 'center', padding: '8px' }}>
              <span 
                onClick={children.length > 0 ? handleToggleExpand : undefined} 
                style={{cursor: children.length > 0 ? 'pointer' : 'default', userSelect: 'none', marginRight: '5px'}}
              >
                {children.length > 0 && (
                  <span>{isExpanded ? '▼' : '►'} </span>
                )}
              </span>
              <span style={taskNameStyle}>{task.name}</span>
              {task.isMilestone && <span style={{ color: 'green', marginLeft: '8px' }}>(M)</span>}
              <span style={{ fontSize: '0.8em', color: '#777', marginLeft: '10px' }}>
                ({task.status} - {task.progress}%)
              </span>
              {task.assigneeId && usersById[task.assigneeId] && (
                <span style={{ fontSize: '0.8em', color: '#555', marginLeft: '10px', fontStyle: 'italic' }}>
                  @{usersById[task.assigneeId].name}
                </span>
              )}
              <div style={{...taskActionsStyle, marginLeft: 'auto' }}> {/* Push actions to the right */}
                <button style={editButtonStyle} onClick={(e) => { e.stopPropagation(); onEditTask(task); }}>Edit</button>
                <button style={deleteButtonStyle} onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}>Delete</button>
              </div>
            </div>

            {/* Custom Fields Display */}
            {customFieldDefinitions && Object.keys(task.customFields || {}).length > 0 && (
              <div style={{ padding: '0 8px 8px 28px', fontSize: '0.8em' }}> {/* Indent custom fields */}
                {customFieldDefinitions.map(def => {
                  const value = task.customFields[def.id];
                  if (value !== undefined && value !== null && value !== '') {
                    let displayValue = value;
                    if (def.type === 'checkbox') displayValue = value ? 'Yes' : 'No';
                    else if (def.type === 'date' && value) displayValue = new Date(value).toLocaleDateString();
                    return (
                      <div key={def.id} className="custom-field-display">
                        <strong>{def.name}:</strong> {displayValue.toString()}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}

            {/* Children Tasks - Nested Droppable */}
            {isExpanded && childTasks.length > 0 && (
              <Droppable droppableId={task.id} type="TASK">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{ 
                      marginTop: '5px', 
                      paddingLeft: '20px', /* Indent children further */
                      background: snapshot.isDraggingOver ? 'lightyellow' : 'transparent',
                      borderRadius: '4px',
                      paddingBottom: '5px'
                    }}
                  >
                    {childTasks.map((childTask, childIndex) => (
                      <TaskItem
                        key={childTask.id}
                        task={childTask}
                        index={childIndex} // Index within this child list
                        allTasks={allTasks}
                        usersById={usersById}
                        customFieldDefinitions={customFieldDefinitions}
                        level={level + 1}
                        onEditTask={onEditTask}
                        onDeleteTask={onDeleteTask}
                        onAddSubTask={onAddSubTask} // Pass down
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )}
          </div>
        )}
      </Draggable>
      {/* Define the Menu component itself. It can be placed anywhere, but often at the end of the component or app. */}
      {/* For simplicity here, each TaskItem could potentially render its own menu instance, 
          but it's better to have one Menu component at a higher level if all menus are the same.
          However, react-contexify handles this well by only one being visible.
          Let's put it here for now, tied to TASK_ITEM_MENU_ID.
          If performance becomes an issue with many TaskItems, this can be refactored to a single Menu instance in App.js.
      */}
      <Menu id={TASK_ITEM_MENU_ID} theme={contexifyTheme.light} animation={contexifyAnimation.fade}>
        <Item onClick={({ props }) => onEditTask(props.task)}>
          Edit Task
        </Item>
        <Item onClick={({ props }) => onDeleteTask(props.task.id)}>
          Delete Task
        </Item>
        <Item onClick={({ props }) => onAddSubTask(props.task.id)}>
          Add Sub-task
        </Item>
      </Menu>
    </>
  );
};

TaskItem.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    parentId: PropTypes.string,
    childrenIds: PropTypes.arrayOf(PropTypes.string),
    startDate: PropTypes.string.isRequired,
    endDate: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    assigneeId: PropTypes.string,
    progress: PropTypes.number.isRequired,
    isMilestone: PropTypes.bool.isRequired,
    customFields: PropTypes.object,
    dependencies: PropTypes.arrayOf(PropTypes.string), // Corrected: was PropTypes.array
  }).isRequired,
  index: PropTypes.number.isRequired, // Required by react-beautiful-dnd
  allTasks: PropTypes.arrayOf(PropTypes.object).isRequired, // Could be more specific: PropTypes.arrayOf(PropTypes.shape(taskShape))
  usersById: PropTypes.objectOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  })).isRequired,
  customFieldDefinitions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  })).isRequired,
  level: PropTypes.number,
  onEditTask: PropTypes.func.isRequired,
  onDeleteTask: PropTypes.func.isRequired,
  onAddSubTask: PropTypes.func.isRequired, // New prop
};

export default TaskItem;
