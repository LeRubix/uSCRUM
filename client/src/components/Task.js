import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { User, Clock, Trash2, Edit, ArrowRight } from 'lucide-react';
import './Task.css';

const Task = ({ task, index, onTaskClick, onDeleteTask, onMoveTask, nextColumnName }) => {
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return 'priority-medium';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getStoryPointsClass = (points) => {
    if (!points) return '';
    switch (points) {
      case 1: return 'points-1';
      case 2: return 'points-2';
      case 3: return 'points-3';
      case 4: return 'points-4';
      case 5: return 'points-5';
      default: return '';
    }
  };

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
        >
          <div className="task-header">
            <div className="task-priority">
              <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
                {task.priority || 'medium'}
              </span>
            </div>
            <div className="task-actions">
              {nextColumnName && (
                <button
                  className="task-action-btn move-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveTask(task.id);
                  }}
                  title={`Move to ${nextColumnName}`}
                >
                  <ArrowRight size={14} />
                </button>
              )}
              <button
                className="task-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onTaskClick(task);
                }}
                title="Edit task"
              >
                <Edit size={14} />
              </button>
              <button
                className="task-action-btn delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Are you sure you want to delete this task?')) {
                    onDeleteTask(task.id);
                  }
                }}
                title="Delete task"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="task-content" onClick={() => onTaskClick(task)}>
            <h4 className="task-title">{task.title}</h4>
            {task.description && (
              <p className="task-description">{task.description}</p>
            )}
          </div>

          <div className="task-footer">
            <div className="task-meta">
              {task.assignee && (
                <div className="task-assignee">
                  <User size={12} />
                  <span>{task.assignee}</span>
                </div>
              )}
              {task.story_points && (
                <div className="task-points">
                  <span className={`points-badge ${getStoryPointsClass(task.story_points)}`}>
                    {task.story_points}
                  </span>
                </div>
              )}
            </div>
            {task.created_at && (
              <div className="task-date">
                <Clock size={12} />
                <span>{formatDate(task.created_at)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default Task; 