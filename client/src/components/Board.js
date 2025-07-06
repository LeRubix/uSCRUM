import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import Column from './Column';
import LoadingSpinner from './LoadingSpinner';
import './Board.css';

const Board = ({ board, onTaskClick, onAddTask, onDeleteTask, onMoveTask, isDragging, loading }) => {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (!board || !board.columns) {
    return (
      <div className="board-container">
        <div className="board-empty">
          <h2>No board selected</h2>
          <p>Select a board from the header to get started</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const sortedColumns = [...board.columns].sort((a, b) => a.position - b.position);

  return (
    <div className="board-container">
      <div className="board-header">
        <div className="board-info">
          <h1 className="board-title">{board.name}</h1>
          {board.created_at && (
            <p className="board-created-date">Created {formatDate(board.created_at)}</p>
          )}
          {board.description && (
            <p className="board-description">{board.description}</p>
          )}
        </div>
        
        <div className="board-stats">
          <div className="stat">
            <span className="stat-value">
              {board.columns.reduce((total, col) => total + col.tasks.length, 0)}
            </span>
            <span className="stat-label">Total Tasks</span>
          </div>
        </div>
      </div>

      <div className="board-content">
        <div className="columns-container">
          {sortedColumns.map((column, index) => {
            const nextColumn = sortedColumns[index + 1];
            return (
              <Column
                key={column.id}
                column={column}
                onTaskClick={onTaskClick}
                onAddTask={onAddTask}
                onDeleteTask={onDeleteTask}
                onMoveTask={onMoveTask}
                nextColumnName={nextColumn ? nextColumn.name : null}
                isDragging={isDragging}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Board; 