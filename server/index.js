const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { getDb, initDatabase, createDefaultBoard } = require('./database');


const setupLogging = () => {
  const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_IS_DEV === 'true';
  
  if (isDev) {
    return {
      log: console.log,
      error: console.error
    };
  }
  
  
  return {
    log: (message) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${message}`);
    },
    error: (message) => {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] ERROR: ${message}`);
    }
  };
};

const logger = setupLogging();

const app = express();
const PORT = process.env.PORT || 5000;


logger.log('Starting SCRUM Board Server...');
logger.log('Node.js version: ' + process.version);
logger.log('Working directory: ' + process.cwd());
logger.log('Environment: ' + (process.env.NODE_ENV || 'not set'));
logger.log('Electron dev mode: ' + (process.env.ELECTRON_IS_DEV || 'not set'));


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


let db;


app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});


app.get('/api/boards', async (req, res) => {
  try {
    if (!db) {
      logger.log('Database not initialized, initializing...');
      db = await getDb();
    }
    db.all('SELECT * FROM boards ORDER BY created_at DESC', [], (err, rows) => {
      if (err) {
        logger.error('Error fetching boards: ' + err.message);
        res.status(500).json({ error: 'Failed to fetch boards' });
        return;
      }
      res.json(rows);
    });
  } catch (error) {
    logger.error('Database error: ' + error.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});


app.get('/api/boards/:id', async (req, res) => {
  try {
    if (!db) db = await getDb();
    const { id } = req.params;
    
    
    db.get('SELECT * FROM boards WHERE id = ?', [id], (err, board) => {
      if (err) {
        logger.error('Error fetching board: ' + err.message);
        res.status(500).json({ error: 'Failed to fetch board' });
        return;
      }
      
      if (!board) {
        res.status(404).json({ error: 'Board not found' });
        return;
      }
      
      
      db.all(
        'SELECT * FROM columns WHERE board_id = ? ORDER BY position',
        [id],
        (err, columns) => {
          if (err) {
            logger.error('Error fetching columns: ' + err.message);
            res.status(500).json({ error: 'Failed to fetch columns' });
            return;
          }
          
          
          db.all(
            'SELECT * FROM tasks WHERE board_id = ? ORDER BY position',
            [id],
            (err, tasks) => {
              if (err) {
                logger.error('Error fetching tasks: ' + err.message);
                res.status(500).json({ error: 'Failed to fetch tasks' });
                return;
              }
              
              
              const columnsWithTasks = columns.map(column => ({
                ...column,
                tasks: tasks.filter(task => task.column_id === column.id)
              }));
              
              res.json({
                ...board,
                columns: columnsWithTasks
              });
            }
          );
        }
      );
    });
  } catch (error) {
    logger.error('Database error: ' + error.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});


app.post('/api/boards', async (req, res) => {
  try {
    if (!db) db = await getDb();
    const { name, description } = req.body;
    const boardId = uuidv4();
    
    db.run(
      'INSERT INTO boards (id, name, description) VALUES (?, ?, ?)',
      [boardId, name, description],
      function(err) {
        if (err) {
          logger.error('Error creating board: ' + err.message);
          res.status(500).json({ error: 'Failed to create board' });
          return;
        }
        
        
        const defaultColumns = [
          { id: uuidv4(), name: 'To Do', position: 0, color: '#ffebee' },
          { id: uuidv4(), name: 'In Progress', position: 1, color: '#fff3e0' },
          { id: uuidv4(), name: 'Review', position: 2, color: '#f3e5f5' },
          { id: uuidv4(), name: 'Done', position: 3, color: '#e8f5e8' }
        ];
        
        const stmt = db.prepare(
          'INSERT INTO columns (id, board_id, name, position, color) VALUES (?, ?, ?, ?, ?)'
        );
        
        defaultColumns.forEach(column => {
          stmt.run([column.id, boardId, column.name, column.position, column.color]);
        });
        
        stmt.finalize((err) => {
          if (err) {
            logger.error('Error creating columns: ' + err.message);
            res.status(500).json({ error: 'Failed to create board columns' });
            return;
          }
          
          res.json({ id: boardId, name, description });
        });
      }
    );
  } catch (error) {
    logger.error('Database error: ' + error.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});


app.post('/api/tasks', async (req, res) => {
  try {
    if (!db) db = await getDb();
    const { title, description, assignee, priority, story_points, board_id, column_id } = req.body;
    const taskId = uuidv4();
    
    
    db.get(
      'SELECT MAX(position) as max_position FROM tasks WHERE column_id = ?',
      [column_id],
      (err, row) => {
        if (err) {
          logger.error('Error getting max position: ' + err.message);
          res.status(500).json({ error: 'Failed to create task' });
          return;
        }
        
        const position = (row.max_position || -1) + 1;
        
        db.run(
          'INSERT INTO tasks (id, title, description, assignee, priority, story_points, board_id, column_id, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [taskId, title, description, assignee, priority, story_points, board_id, column_id, position],
          function(err) {
            if (err) {
              logger.error('Error creating task: ' + err.message);
              res.status(500).json({ error: 'Failed to create task' });
              return;
            }
            
            res.json({ 
              id: taskId, 
              title, 
              description, 
              assignee, 
              priority, 
              story_points, 
              board_id, 
              column_id, 
              position 
            });
          }
        );
      }
    );
  } catch (error) {
    logger.error('Database error: ' + error.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});


app.put('/api/tasks/:id', async (req, res) => {
  try {
    if (!db) db = await getDb();
    const { id } = req.params;
    const { title, description, assignee, priority, story_points } = req.body;
    
    db.run(
      'UPDATE tasks SET title = ?, description = ?, assignee = ?, priority = ?, story_points = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, description, assignee, priority, story_points, id],
      function(err) {
        if (err) {
          logger.error('Error updating task: ' + err.message);
          res.status(500).json({ error: 'Failed to update task' });
          return;
        }
        
        if (this.changes === 0) {
          res.status(404).json({ error: 'Task not found' });
          return;
        }
        
        res.json({ message: 'Task updated successfully' });
      }
    );
  } catch (error) {
    logger.error('Database error: ' + error.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});


app.put('/api/tasks/:id/move', async (req, res) => {
  try {
    if (!db) db = await getDb();
    const { id } = req.params;
    const { column_id, position } = req.body;
    
    db.run(
      'UPDATE tasks SET column_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [column_id, position, id],
      function(err) {
        if (err) {
          logger.error('Error moving task: ' + err.message);
          res.status(500).json({ error: 'Failed to move task' });
          return;
        }
        
        if (this.changes === 0) {
          res.status(404).json({ error: 'Task not found' });
          return;
        }
        
        res.json({ message: 'Task moved successfully' });
      }
    );
  } catch (error) {
    logger.error('Database error: ' + error.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});


app.delete('/api/tasks/:id', async (req, res) => {
  try {
    if (!db) db = await getDb();
    const { id } = req.params;
    
    db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
      if (err) {
        logger.error('Error deleting task: ' + err.message);
        res.status(500).json({ error: 'Failed to delete task' });
        return;
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
      
      res.json({ message: 'Task deleted successfully' });
    });
  } catch (error) {
    logger.error('Database error: ' + error.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});


app.delete('/api/boards/:id', async (req, res) => {
  try {
    if (!db) db = await getDb();
    const { id } = req.params;
    
    
    db.get('SELECT * FROM boards WHERE id = ?', [id], (err, board) => {
      if (err) {
        logger.error('Error checking board existence: ' + err.message);
        res.status(500).json({ error: 'Failed to delete board' });
        return;
      }
      
      if (!board) {
        res.status(404).json({ error: 'Board not found' });
        return;
      }
      
      
      db.run('DELETE FROM tasks WHERE board_id = ?', [id], function(err) {
        if (err) {
          logger.error('Error deleting tasks: ' + err.message);
          res.status(500).json({ error: 'Failed to delete board tasks' });
          return;
        }
        
        
        db.run('DELETE FROM columns WHERE board_id = ?', [id], function(err) {
          if (err) {
            logger.error('Error deleting columns: ' + err.message);
            res.status(500).json({ error: 'Failed to delete board columns' });
            return;
          }
          
          
          db.run('DELETE FROM boards WHERE id = ?', [id], function(err) {
            if (err) {
              logger.error('Error deleting board: ' + err.message);
              res.status(500).json({ error: 'Failed to delete board' });
              return;
            }
            
            logger.log('Board deleted successfully: ' + id);
            res.json({ message: 'Board deleted successfully' });
          });
        });
      });
    });
  } catch (error) {
    logger.error('Database error: ' + error.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});


app.get('/api/boards/:id/backup', async (req, res) => {
  try {
    if (!db) db = await getDb();
    const { id } = req.params;
    
    
    db.get('SELECT * FROM boards WHERE id = ?', [id], (err, board) => {
      if (err) {
        logger.error('Error fetching board for backup: ' + err.message);
        res.status(500).json({ error: 'Failed to backup board' });
        return;
      }
      
      if (!board) {
        res.status(404).json({ error: 'Board not found' });
        return;
      }
      
      
      db.all(
        'SELECT * FROM columns WHERE board_id = ? ORDER BY position',
        [id],
        (err, columns) => {
          if (err) {
            logger.error('Error fetching columns for backup: ' + err.message);
            res.status(500).json({ error: 'Failed to backup board columns' });
            return;
          }
          
          
          db.all(
            'SELECT * FROM tasks WHERE board_id = ? ORDER BY position',
            [id],
            (err, tasks) => {
              if (err) {
                logger.error('Error fetching tasks for backup: ' + err.message);
                res.status(500).json({ error: 'Failed to backup board tasks' });
                return;
              }
              
              
              const backupData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                board: {
                  name: board.name,
                  description: board.description,
                  columns: columns.map(column => ({
                    name: column.name,
                    position: column.position,
                    color: column.color,
                    tasks: tasks
                      .filter(task => task.column_id === column.id)
                      .map(task => ({
                        title: task.title,
                        description: task.description,
                        assignee: task.assignee,
                        priority: task.priority,
                        story_points: task.story_points,
                        position: task.position
                      }))
                  }))
                }
              };
              
              logger.log('Board backup created successfully: ' + id);
              res.json(backupData);
            }
          );
        }
      );
    });
  } catch (error) {
    logger.error('Database error: ' + error.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});


app.post('/api/boards/import', async (req, res) => {
  try {
    if (!db) db = await getDb();
    const boardData = req.body;
    
    
    if (!boardData || !boardData.name || !boardData.columns || !Array.isArray(boardData.columns)) {
      logger.error('Invalid import data structure received:', JSON.stringify(boardData, null, 2));
      res.status(400).json({ error: 'Invalid import data structure. Expected board with name and columns array.' });
      return;
    }
    
    logger.log('Importing board: ' + boardData.name);
    const boardId = uuidv4();
    
    
    db.run(
      'INSERT INTO boards (id, name, description) VALUES (?, ?, ?)',
      [boardId, boardData.name, boardData.description || ''],
      function(err) {
        if (err) {
          logger.error('Error creating imported board: ' + err.message);
          res.status(500).json({ error: 'Failed to import board' });
          return;
        }
        
        
        let completedColumns = 0;
        const totalColumns = boardData.columns.length;
        
        if (totalColumns === 0) {
          res.json({ id: boardId, name: boardData.name, description: boardData.description });
          return;
        }
        
        boardData.columns.forEach((column, columnIndex) => {
          const columnId = uuidv4();
          
          db.run(
            'INSERT INTO columns (id, board_id, name, position, color) VALUES (?, ?, ?, ?, ?)',
            [columnId, boardId, column.name, column.position || columnIndex, column.color || '#f0f0f0'],
            function(err) {
              if (err) {
                logger.error('Error creating imported column: ' + err.message);
                res.status(500).json({ error: 'Failed to import board columns' });
                return;
              }
              
              
              if (column.tasks && column.tasks.length > 0) {
                const stmt = db.prepare(
                  'INSERT INTO tasks (id, title, description, assignee, priority, story_points, board_id, column_id, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
                );
                
                column.tasks.forEach((task, taskIndex) => {
                  const taskId = uuidv4();
                  stmt.run([
                    taskId,
                    task.title,
                    task.description || '',
                    task.assignee || '',
                    task.priority || 'medium',
                    task.story_points || 0,
                    boardId,
                    columnId,
                    task.position || taskIndex
                  ]);
                });
                
                stmt.finalize();
              }
              
              completedColumns++;
              if (completedColumns === totalColumns) {
                logger.log('Board imported successfully: ' + boardId + ' (' + boardData.name + ')');
                res.json({ id: boardId, name: boardData.name, description: boardData.description });
              }
            }
          );
        });
      }
    );
  } catch (error) {
    logger.error('Database error during import: ' + error.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
});


app.use((err, req, res, next) => {
  logger.error('Unhandled error: ' + err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});


async function startServer() {
  try {
    logger.log('Initializing database...');
    await initDatabase();
    logger.log('Database initialized successfully');
    
    logger.log('Creating default board if needed...');
    await createDefaultBoard();
    logger.log('Default board check completed');
    
    
    db = await getDb();
    logger.log('Database connection established');
    
    
    db.get('SELECT COUNT(*) as count FROM boards', [], (err, row) => {
      if (err) {
        logger.error('Database test failed: ' + err.message);
      } else {
        logger.log('Database test passed. Found ' + row.count + ' boards');
      }
    });
    
    app.listen(PORT, () => {
      logger.log(`Server running on port ${PORT}`);
      logger.log('Server startup completed successfully');
    });
  } catch (error) {
    logger.error('Failed to start server: ' + error.message);
    logger.error('Stack trace: ' + error.stack);
    process.exit(1);
  }
}


process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception: ' + error.message);
  logger.error('Stack trace: ' + error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at: ' + promise + ', reason: ' + reason);
  process.exit(1);
});

startServer(); 