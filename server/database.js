const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const os = require('os');


const getDbPath = () => {
  const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_IS_DEV === 'true';
  
  if (isDev) {
    
    return path.join(__dirname, 'scrum_board.db');
  } else {
    
    try {
      const { app } = require('electron');
      if (app && app.getPath) {
        const userDataPath = app.getPath('userData');
        
        
        if (!fs.existsSync(userDataPath)) {
          fs.mkdirSync(userDataPath, { recursive: true });
        }
        
        return path.join(userDataPath, 'scrum_board.db');
      }
    } catch (error) {
      console.log('Electron app not available, using fallback path');
    }
    
    
    const userDataPath = path.join(os.homedir(), '.scrum-board');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    return path.join(userDataPath, 'scrum_board.db');
  }
};


const isElectron = () => {
  return typeof process !== 'undefined' && 
         process.versions && 
         process.versions.electron;
};


const getDbPathSafe = () => {
  if (isElectron()) {
    return getDbPath();
  } else {
    
    return path.join(__dirname, 'scrum_board.db');
  }
};

const dbPath = getDbPathSafe();
console.log('Database path:', dbPath);

let db;


const initDbConnection = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
      } else {
        console.log('Database opened successfully at:', dbPath);
        resolve(db);
      }
    });
  });
};


const initDatabase = async () => {
  if (!db) {
    await initDbConnection();
  }
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      
      db.run(`
        CREATE TABLE IF NOT EXISTS boards (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      
      db.run(`
        CREATE TABLE IF NOT EXISTS columns (
          id TEXT PRIMARY KEY,
          board_id TEXT NOT NULL,
          name TEXT NOT NULL,
          position INTEGER NOT NULL,
          color TEXT DEFAULT '#e3f2fd',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (board_id) REFERENCES boards (id) ON DELETE CASCADE
        )
      `);

      
      db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          board_id TEXT NOT NULL,
          column_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          assignee TEXT,
          priority TEXT DEFAULT 'medium',
          story_points INTEGER,
          position INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (board_id) REFERENCES boards (id) ON DELETE CASCADE,
          FOREIGN KEY (column_id) REFERENCES columns (id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating tables:', err);
          reject(err);
        } else {
          console.log('Database tables initialized successfully');
          resolve();
        }
      });
    });
  });
};


const createDefaultBoard = async () => {
  if (!db) {
    await initDbConnection();
  }
  
  return new Promise((resolve, reject) => {
    db.get("SELECT COUNT(*) as count FROM boards", (err, row) => {
      if (err) {
        console.error('Error checking boards:', err);
        reject(err);
        return;
      }

      if (row.count === 0) {
        const boardId = 'default-board-' + Date.now();
        const columns = [
          { id: 'col-1', name: 'To Do', position: 0, color: '#ffebee' },
          { id: 'col-2', name: 'In Progress', position: 1, color: '#fff3e0' },
          { id: 'col-3', name: 'Review', position: 2, color: '#f3e5f5' },
          { id: 'col-4', name: 'Done', position: 3, color: '#e8f5e8' }
        ];

        db.run(`
          INSERT INTO boards (id, name, description) 
          VALUES (?, ?, ?)
        `, [boardId, 'My SCRUM Board', 'Default project board'], (err) => {
          if (err) {
            console.error('Error creating default board:', err);
            reject(err);
            return;
          }

          const stmt = db.prepare(`
            INSERT INTO columns (id, board_id, name, position, color) 
            VALUES (?, ?, ?, ?, ?)
          `);

          columns.forEach((col) => {
            stmt.run([col.id, boardId, col.name, col.position, col.color]);
          });

          stmt.finalize((err) => {
            if (err) {
              console.error('Error creating default columns:', err);
              reject(err);
            } else {
              console.log('Default board and columns created');
              resolve();
            }
          });
        });
      } else {
        console.log('Boards already exist, skipping default creation');
        resolve();
      }
    });
  });
};


const getDb = async () => {
  if (!db) {
    await initDbConnection();
  }
  return db;
};

module.exports = {
  get db() {
    return db;
  },
  getDb,
  initDatabase,
  createDefaultBoard,
  initDbConnection
}; 