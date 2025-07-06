import React, { useState, useEffect } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import axios from 'axios';
import Header from './components/Header';
import Board from './components/Board';
import TaskModal from './components/TaskModal';
import LoadingSpinner from './components/LoadingSpinner';
import Notification from './components/Notification';
import './App.css';


const isElectron = () => {
  
  if (typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer') {
    return true;
  }
  
  if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
    return true;
  }
  
  if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
    return true;
  }
  return false;
};


const getApiBaseUrl = () => {
  const electronApiUrl = typeof window !== 'undefined' && window.API_BASE_URL;
  const fallbackUrl = '/api';
  
  const finalUrl = electronApiUrl || fallbackUrl;
  
  console.log('🔍 API URL Detection:');
  console.log('  - Is Electron:', isElectron());
  console.log('  - window.API_BASE_URL:', electronApiUrl);
  console.log('  - Final API_BASE_URL:', finalUrl);
  
  return finalUrl;
};

function App() {
  const [boards, setBoards] = useState([]);
  const [currentBoard, setCurrentBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState(getApiBaseUrl());
  const [notification, setNotification] = useState({
    isVisible: false,
    type: 'success',
    title: '',
    message: ''
  });

  
  useEffect(() => {
    const timer = setTimeout(() => {
      const newUrl = getApiBaseUrl();
      if (newUrl !== apiBaseUrl) {
        console.log('🔄 API URL updated from', apiBaseUrl, 'to', newUrl);
        setApiBaseUrl(newUrl);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [apiBaseUrl]); 

  const showNotification = (type, title, message) => {
    setNotification({
      isVisible: true,
      type,
      title,
      message
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({
      ...prev,
      isVisible: false
    }));
  };

  const fetchBoards = async () => {
    try {
      console.log('📡 Fetching boards from:', `${apiBaseUrl}/boards`);
      const response = await axios.get(`${apiBaseUrl}/boards`);
      console.log('✅ Boards response:', response.data);
      setBoards(response.data);
      if (response.data.length > 0) {
        await fetchBoard(response.data[0].id);
      }
    } catch (error) {
      console.error('❌ Error fetching boards:', error);
      console.error('   - URL attempted:', `${apiBaseUrl}/boards`);
      console.error('   - Error details:', error.message);
      if (error.response) {
        console.error('   - Response status:', error.response.status);
        console.error('   - Response data:', error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchBoard = async (boardId) => {
    try {
      setLoading(true);
      console.log('📡 Fetching board:', `${apiBaseUrl}/boards/${boardId}`);
      const response = await axios.get(`${apiBaseUrl}/boards/${boardId}`);
      console.log('✅ Board response:', response.data);
      setCurrentBoard(response.data);
    } catch (error) {
      console.error('❌ Error fetching board:', error);
      console.error('   - URL attempted:', `${apiBaseUrl}/boards/${boardId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = async (result) => {
    setIsDragging(false);
    
    const { destination, source, draggableId } = result;
    
    console.log('Drag result:', { destination, source, draggableId });

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    
    const newBoard = { ...currentBoard };
    const sourceColumn = newBoard.columns.find(col => String(col.id) === source.droppableId);
    const destColumn = newBoard.columns.find(col => String(col.id) === destination.droppableId);
    const task = sourceColumn.tasks.find(task => String(task.id) === draggableId);
    
    
    sourceColumn.tasks.splice(source.index, 1);
    
    
    destColumn.tasks.splice(destination.index, 0, {
      ...task,
      column_id: destination.droppableId
    });

    setCurrentBoard(newBoard);

    
    try {
      await axios.put(`${apiBaseUrl}/tasks/${draggableId}/move`, {
        column_id: destination.droppableId,
        position: destination.index
      });
    } catch (error) {
      console.error('Error moving task:', error);
      
      await fetchBoard(currentBoard.id);
    }
  };

  const openTaskModal = (task = null, columnId = null) => {
    console.log('🎯 Opening task modal:', { task, columnId });
    setEditingTask(task);
    setSelectedColumn(columnId);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    console.log('❌ Closing task modal');
    setIsTaskModalOpen(false);
    setEditingTask(null);
    setSelectedColumn(null);
  };

  const handleTaskSave = async (taskData) => {
    try {
      console.log('💾 Saving task:', taskData);
      if (editingTask) {
        
        console.log('📡 Updating task:', `${apiBaseUrl}/tasks/${editingTask.id}`);
        await axios.put(`${apiBaseUrl}/tasks/${editingTask.id}`, taskData);
      } else {
        
        const payload = {
          ...taskData,
          board_id: currentBoard.id,
          column_id: selectedColumn
        };
        console.log('📡 Creating task:', `${apiBaseUrl}/tasks`, payload);
        await axios.post(`${apiBaseUrl}/tasks`, payload);
      }
      
      
      await fetchBoard(currentBoard.id);
      closeTaskModal();
    } catch (error) {
      console.error('❌ Error saving task:', error);
    }
  };

  const handleTaskDelete = async (taskId) => {
    try {
      console.log('🗑️ Deleting task:', `${apiBaseUrl}/tasks/${taskId}`);
      await axios.delete(`${apiBaseUrl}/tasks/${taskId}`);
      await fetchBoard(currentBoard.id);
    } catch (error) {
      console.error('❌ Error deleting task:', error);
    }
  };

  const handleMoveTask = async (taskId) => {
    try {
      
      const currentTask = currentBoard.columns
        .flatMap(col => col.tasks)
        .find(task => task.id === taskId);
      
      if (!currentTask) return;

      const currentColumnIndex = [...currentBoard.columns]
        .sort((a, b) => a.position - b.position)
        .findIndex(col => col.id === currentTask.column_id);
      
      const sortedColumns = [...currentBoard.columns].sort((a, b) => a.position - b.position);
      const nextColumn = sortedColumns[currentColumnIndex + 1];
      
      if (!nextColumn) return; 

      
      await axios.put(`${apiBaseUrl}/tasks/${taskId}/move`, {
        column_id: nextColumn.id,
        position: nextColumn.tasks.length 
      });

      
      await fetchBoard(currentBoard.id);
    } catch (error) {
      console.error('Error moving task:', error);
    }
  };

  const createNewBoard = async (boardData) => {
    try {
      console.log('🆕 Creating board:', `${apiBaseUrl}/boards`, boardData);
      const response = await axios.post(`${apiBaseUrl}/boards`, boardData);
      console.log('✅ Board created:', response.data);
      await fetchBoards();
      await fetchBoard(response.data.id);
      
      showNotification('success', 'Board Created', `Board "${boardData.name}" has been created successfully!`);
    } catch (error) {
      console.error('❌ Error creating board:', error);
      showNotification('error', 'Creation Failed', 'Failed to create board. Please try again.');
    }
  };

  const handleDeleteBoard = async (boardId) => {
    try {
      
      const boardToDelete = boards.find(board => board.id === boardId);
      const boardName = boardToDelete?.name || 'Board';
      
      console.log('🗑️ Deleting board:', `${apiBaseUrl}/boards/${boardId}`);
      await axios.delete(`${apiBaseUrl}/boards/${boardId}`);
      
      
      const updatedBoards = boards.filter(board => board.id !== boardId);
      setBoards(updatedBoards);
      
      
      if (currentBoard && currentBoard.id === boardId) {
        if (updatedBoards.length > 0) {
          await fetchBoard(updatedBoards[0].id);
        } else {
          setCurrentBoard(null);
        }
      }
      
      console.log('✅ Board deleted successfully');
      showNotification('success', 'Board Deleted', `"${boardName}" has been deleted successfully.`);
    } catch (error) {
      console.error('❌ Error deleting board:', error);
      showNotification('error', 'Deletion Failed', 'Failed to delete board. Please try again.');
    }
  };

  const handleBackupBoard = async (boardId) => {
    try {
      console.log('💾 Backing up board:', `${apiBaseUrl}/boards/${boardId}/backup`);
      const response = await axios.get(`${apiBaseUrl}/boards/${boardId}/backup`);
      
      
      const boardData = response.data;
      
      
      const boardName = boardData.board?.name || boardData.name || 'untitled-board';
      const safeFileName = boardName.replace(/[^a-z0-9\-_]/gi, '_').toLowerCase();
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `${safeFileName}_backup_${dateStr}.json`;
      
      const blob = new Blob([JSON.stringify(boardData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      console.log('✅ Board backup downloaded successfully:', fileName);
      
      showNotification('success', 'Backup Complete', `Board "${boardName}" has been backed up successfully.`);
    } catch (error) {
      console.error('❌ Error backing up board:', error);
      console.error('   - Error details:', error.response?.data || error.message);
      showNotification('error', 'Backup Failed', error.response?.data?.error || error.message);
    }
  };

  const handleImportBoard = async (boardData) => {
    try {
      console.log('📥 Importing board:', boardData);
      
      
      let boardToImport;
      
      if (boardData.board && boardData.version) {
        
        boardToImport = boardData.board;
        console.log('📥 Detected backup file format');
      } else if (boardData.name && boardData.columns) {
        
        boardToImport = boardData;
        console.log('📥 Detected direct board format');
      } else {
        throw new Error('Invalid board data structure. Expected backup file with board data or direct board format.');
      }
      
      if (!boardToImport || !boardToImport.name || !boardToImport.columns || !Array.isArray(boardToImport.columns)) {
        throw new Error('Invalid board data structure. Missing required fields: name, columns.');
      }
      
      console.log('📥 Board to import:', boardToImport);
      
      const response = await axios.post(`${apiBaseUrl}/boards/import`, boardToImport);
      console.log('✅ Board imported successfully:', response.data);
      
      
      await fetchBoards();
      await fetchBoard(response.data.id);
      
      showNotification('success', 'Import Complete', `Board "${boardToImport.name}" has been imported successfully!`);
    } catch (error) {
      console.error('❌ Error importing board:', error);
      let errorMessage = error.response?.data?.error || error.message || 'Please check the file format and try again.';
      showNotification('error', 'Import Failed', errorMessage);
    }
  };

  if (loading && !currentBoard) {
    return <LoadingSpinner />;
  }

  return (
    <div className="app">
      <Header
        boards={boards}
        currentBoard={currentBoard}
        onBoardSelect={fetchBoard}
        onCreateBoard={createNewBoard}
        onDeleteBoard={handleDeleteBoard}
        onBackupBoard={handleBackupBoard}
        onImportBoard={handleImportBoard}
      />
      
      {currentBoard ? (
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <Board
            board={currentBoard}
            onTaskClick={openTaskModal}
            onAddTask={openTaskModal}
            onDeleteTask={handleTaskDelete}
            onMoveTask={handleMoveTask}
            isDragging={isDragging}
          />
        </DragDropContext>
      ) : (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <p>No boards found</p>
          <p style={{ fontSize: '0.8rem', color: '#666' }}>
            API URL: {apiBaseUrl}
          </p>
        </div>
      )}

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={closeTaskModal}
        onSave={handleTaskSave}
        task={editingTask}
        columns={currentBoard?.columns || []}
      />

      <Notification
        type={notification.type}
        title={notification.title}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </div>
  );
}

export default App; 