import React, { useState, useMemo, useEffect } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Plus, ArrowUpDown } from 'lucide-react';
import Task from './Task';
import './Column.css';

const Column = ({ column, onTaskClick, onAddTask, onDeleteTask, onMoveTask, nextColumnName, isDragging }) => {
  const [sortBy, setSortBy] = useState('original');

  
  useEffect(() => {
    setSortBy('original');
  }, [column.tasks]);

  const tasksToDisplay = useMemo(() => {
    if (!column.tasks) return [];
    
    
    
    const tasks = [...column.tasks];
    
    
    if (!isDragging && sortBy !== 'original') {
      switch (sortBy) {
        case 'time':
          return tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return tasks.sort((a, b) => (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2));
        case 'points':
          return tasks.sort((a, b) => (b.story_points || 0) - (a.story_points || 0));
        case 'alphabetical':
          return tasks.sort((a, b) => a.title.localeCompare(b.title));
        default:
          return tasks;
      }
    }
    
    return tasks;
  }, [column.tasks, sortBy, isDragging]);

  return (
    <div className="column">
      <div className="column-header">
        <div className="column-title-section">
          <h3 className="column-title">{column.name}</h3>
          <span className="task-count">{column.tasks.length}</span>
        </div>
        <div className="column-controls">
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            title="Sort tasks"
            disabled={isDragging}
          >
            <option value="original">Original</option>
            <option value="time">Latest</option>
            <option value="priority">Priority</option>
            <option value="points">Points</option>
            <option value="alphabetical">A-Z</option>
          </select>
          <button
            className="btn btn-icon btn-secondary add-task-btn"
            onClick={() => onAddTask(null, column.id)}
            title="Add new task"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <Droppable droppableId={String(column.id)}>
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`column-content ${
              snapshot.isDraggingOver ? 'dragging-over' : ''
            }`}
          >
            {tasksToDisplay.map((task, index) => (
              <Task
                key={task.id}
                task={task}
                index={index}
                onTaskClick={onTaskClick}
                onDeleteTask={onDeleteTask}
                onMoveTask={onMoveTask}
                nextColumnName={nextColumnName}
              />
            ))}
            {provided.placeholder}
            
            {column.tasks.length === 0 && (
              <div className="column-empty">
                <p>No tasks yet</p>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onAddTask(null, column.id)}
                >
                  <Plus size={14} />
                  Add first task
                </button>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default Column; 