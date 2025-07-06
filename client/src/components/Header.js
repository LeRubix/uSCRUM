import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronDown, LayoutDashboard, Moon, Sun, Trash2, AlertTriangle, Download, Upload } from 'lucide-react';
import './Header.css';

const Header = ({ boards, currentBoard, onBoardSelect, onCreateBoard, onDeleteBoard, onBackupBoard, onImportBoard }) => {
  const [showBoardDropdown, setShowBoardDropdown] = useState(false);
  const [showNewBoardForm, setShowNewBoardForm] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleCreateBoard = (e) => {
    e.preventDefault();
    if (newBoardName.trim()) {
      onCreateBoard({
        name: newBoardName.trim(),
        description: newBoardDescription.trim()
      });
      setNewBoardName('');
      setNewBoardDescription('');
      setShowNewBoardForm(false);
    }
  };

  const handleDeleteBoard = (board, e) => {
    e.stopPropagation();
    setBoardToDelete(board);
    setShowDeleteConfirmation(true);
    setShowBoardDropdown(false);
  };

  const confirmDeleteBoard = () => {
    if (boardToDelete) {
      onDeleteBoard(boardToDelete.id);
      setBoardToDelete(null);
      setShowDeleteConfirmation(false);
    }
  };

  const cancelDeleteBoard = () => {
    setBoardToDelete(null);
    setShowDeleteConfirmation(false);
  };

  const handleBackupBoard = () => {
    if (currentBoard) {
      onBackupBoard(currentBoard.id);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const boardData = JSON.parse(e.target.result);
          onImportBoard(boardData);
        } catch (error) {
          console.error('Error parsing JSON file:', error);
          alert('Invalid JSON file. Please select a valid board backup file.');
        }
      };
      reader.readAsText(file);
    } else {
      alert('Please select a valid JSON file.');
    }
    
    event.target.value = '';
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <div className="logo">
            <LayoutDashboard size={24} />
            <span>uSCRUM</span>
          </div>
        </div>

        <div className="header-center">
          {currentBoard && (
            <div className="board-selector">
              <button
                className="board-selector-btn"
                onClick={() => setShowBoardDropdown(!showBoardDropdown)}
              >
                <span className="board-name">{currentBoard.name}</span>
                <ChevronDown size={16} />
              </button>

              {showBoardDropdown && (
                <div className="board-dropdown">
                  <div className="board-list">
                    {boards.map((board) => (
                      <button
                        key={board.id}
                        className={`board-item ${
                          currentBoard.id === board.id ? 'active' : ''
                        }`}
                        onClick={() => {
                          onBoardSelect(board.id);
                          setShowBoardDropdown(false);
                        }}
                      >
                        <div className="board-item-content">
                          <div className="board-item-info">
                            <span className="board-item-name">{board.name}</span>
                            {board.description && (
                              <span className="board-item-desc">{board.description}</span>
                            )}
                          </div>
                          <div className="board-item-actions">
                            <button
                              className="delete-board-btn"
                              onClick={(e) => handleDeleteBoard(board, e)}
                              title="Delete board"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="board-dropdown-footer">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setShowNewBoardForm(true);
                        setShowBoardDropdown(false);
                      }}
                    >
                      <Plus size={16} />
                      Create New Board
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="header-right">
          {currentBoard && (
            <div className="backup-import-buttons">
              <button
                className="btn btn-secondary"
                onClick={handleBackupBoard}
                title="Backup current board"
              >
                <Download size={16} />
                <span>Backup</span>
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleImportClick}
                title="Import board from file"
              >
                <Upload size={16} />
                <span>Import</span>
              </button>
            </div>
          )}
          <button
            className="btn btn-icon btn-secondary theme-toggle"
            onClick={toggleTheme}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowNewBoardForm(true)}
          >
            <Plus size={16} />
            New Board
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".json"
        className="file-input-hidden"
      />

      {showNewBoardForm && (
        <div className="modal-overlay" onClick={() => setShowNewBoardForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Board</h3>
              <button
                className="btn btn-icon btn-secondary"
                onClick={() => setShowNewBoardForm(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleCreateBoard}>
                <div className="form-group">
                  <label htmlFor="boardName">Board Name *</label>
                  <input
                    id="boardName"
                    type="text"
                    className="form-input"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    placeholder="Enter board name"
                    required
                    autoFocus
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="boardDescription">Description</label>
                  <textarea
                    id="boardDescription"
                    className="form-input form-textarea"
                    value={newBoardDescription}
                    onChange={(e) => setNewBoardDescription(e.target.value)}
                    placeholder="Enter board description (optional)"
                    rows="3"
                  />
                </div>
                
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowNewBoardForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Board
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirmation && boardToDelete && (
        <div className="modal-overlay" onClick={cancelDeleteBoard}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Board</h3>
              <button
                className="btn btn-icon btn-secondary"
                onClick={cancelDeleteBoard}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="delete-confirmation">
                <div className="warning-icon">
                  <AlertTriangle size={48} />
                </div>
                <p>Are you sure you want to delete the board</p>
                <p className="board-name-highlight">"{boardToDelete.name}"</p>
                <p>This action cannot be undone. All tasks and data in this board will be permanently deleted.</p>
              </div>
              
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cancelDeleteBoard}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmDeleteBoard}
                >
                  <Trash2 size={16} />
                  Delete Board
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 