import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Gantt from 'frappe-gantt';
import './GanttChart.css';

const GanttChart = ({ tasks, viewMode = 'Week', criticalPathTaskIds = [] }) => {
  const ganttRef = useRef(null);
  let ganttInstance = useRef(null);

  // Props for event handlers from App.js
  const { onTaskDateChange, onTaskProgressChange } = { ...props };


  useEffect(() => {
    if (!ganttRef.current || !tasks || tasks.length === 0) {
      // Clear previous Gantt instance if tasks are removed or empty
      if (ganttInstance.current) {
        ganttInstance.current.clear();
        ganttInstance.current = null;
      }
      if (ganttRef.current) {
        ganttRef.current.innerHTML = '<p>No tasks to display in Gantt chart.</p>';
      }
      return;
    }

    // Frappe Gantt expects tasks in a specific format
    const formattedTasks = tasks.map(task => ({
      id: task.id,
      name: task.name,
      start: task.startDate, // Expects 'YYYY-MM-DD' after formatting
      end: task.endDate,     // Expects 'YYYY-MM-DD' after formatting
      progress: task.progress,
      // Frappe Gantt expects dependencies as a comma-separated string of predecessor task IDs.
      // Our task.dependencies is now an array of objects: [{ predecessorId: 'id', type: 'FS', lag: 0 }, ...]
      dependencies: task.dependencies && task.dependencies.length > 0 
        ? task.dependencies.map(dep => dep.predecessorId).join(',') 
        : undefined,
      custom_class: `${task.isMilestone ? 'milestone-task' : ''} ${criticalPathTaskIds.includes(task.id) ? 'critical-task' : ''}`.trim()
    }));

    // Clear previous instance before creating a new one
    if (ganttInstance.current) {
      ganttInstance.current.clear();
    }
    
    // Workaround for "Invalid Date" if ISO string is directly used by Frappe Gantt
    // It's safer to ensure dates are in 'YYYY-MM-DD' format
    const ensureYYYYMMDD = (dateString) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const tasksForGantt = formattedTasks.map(task => ({
        ...task,
        start: ensureYYYYMMDD(task.start),
        end: ensureYYYYMMDD(task.end),
    }));


    ganttInstance.current = new Gantt(ganttRef.current, tasksForGantt, {
      header_height: 50,
      column_width: 30,
      step: 24,
      view_modes: ['Quarter Day', 'Half Day', 'Day', 'Week', 'Month'],
      bar_height: 20,
      bar_corner_radius: 3,
      arrow_curve: 5,
      padding: 18,
      view_mode: viewMode, // Initial view mode
      date_format: 'YYYY-MM-DD',
      language: 'en', // Default is 'en'
      custom_popup_html: function(task) {
        // Custom popup content
        const startDate = new Date(task.start).toLocaleDateString();
        const endDate = new Date(task.end).toLocaleDateString();
        return `
          <div class="gantt-popup">
            <h5>${task.name}</h5>
            <p>Status: ${task.progress}% complete</p>
            <p>Starts: ${startDate}</p>
            <p>Ends: ${endDate}</p>
            ${task.custom_class === 'milestone-task' ? '<p><strong>Milestone</strong></p>' : ''}
          </div>
        `;
      },
      on_click: (task_clicked) => { // Renamed 'task' to 'task_clicked' to avoid confusion with outer scope 'tasks'
        console.log("Task clicked:", task_clicked);
        // Potentially handle task click, e.g., open an editor for the task
      },
      on_date_change: (task_updated, start, end) => {
        console.log("Date changed in Gantt:", task_updated.id, start, end);
        if (onTaskDateChange) {
          // Frappe Gantt might return dates as Date objects or strings depending on version/context.
          // Ensure they are consistently ISO strings for the App state.
          const newStartDate = start instanceof Date ? start.toISOString() : new Date(start).toISOString();
          const newEndDate = end instanceof Date ? end.toISOString() : new Date(end).toISOString();
          onTaskDateChange(task_updated.id, newStartDate, newEndDate);
        }
      },
      on_progress_change: (task_updated, progress) => {
        console.log("Progress changed in Gantt:", task_updated.id, progress);
        if (onTaskProgressChange) {
          onTaskProgressChange(task_updated.id, progress);
        }
      },
      on_view_change: (mode) => {
        console.log("Gantt View changed to:", mode);
        // Handle view mode changes if necessary (e.g., save user preference)
      }
    });

    return () => {
      // Cleanup when component unmounts or before re-rendering
      if (ganttInstance.current) {
        ganttInstance.current.clear();
        ganttInstance.current = null;
      }
    };
  }, [tasks, viewMode]); // Re-run effect if tasks or viewMode change

  return <div ref={ganttRef} className="gantt-chart-container"></div>;
};

GanttChart.propTypes = {
  tasks: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    startDate: PropTypes.string.isRequired,
    endDate: PropTypes.string.isRequired,
    progress: PropTypes.number.isRequired,
    parentId: PropTypes.string, // For hierarchy, not Gantt dependencies
    dependencies: PropTypes.arrayOf(PropTypes.string), // For Gantt dependencies
    isMilestone: PropTypes.bool,
  })).isRequired,
  viewMode: PropTypes.oneOf(['Day', 'Week', 'Month', 'Quarter Day', 'Half Day']),
  criticalPathTaskIds: PropTypes.arrayOf(PropTypes.string), // IDs of tasks on the critical path
  onTaskDateChange: PropTypes.func,
  onTaskProgressChange: PropTypes.func,
};

GanttChart.defaultProps = {
  criticalPathTaskIds: [], // Default to empty array
};

export default GanttChart;
