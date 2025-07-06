# SCRUM Board Application

A modern, sleek, and simple SCRUM board application for project management with persistent local storage.

![SCRUM Board](https://img.shields.io/badge/SCRUM-Board-blue)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![SQLite](https://img.shields.io/badge/Database-SQLite-orange)

<br>

![image](https://github.com/user-attachments/assets/5f494c12-969f-4ab7-b133-81329e2949ac)
![image](https://github.com/user-attachments/assets/4bc3f6cf-d999-49e0-9599-05455525fc81)
<br>

## Features

### ❗ Core Features
- **Drag & Drop Interface**: Intuitive task management with beautiful drag-and-drop functionality
- **Multiple Boards**: Create and manage multiple project boards
- **Task Management**: Create, edit, delete, and organize tasks
- **Persistent Storage**: Local SQLite database for data persistence
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 🎯 SCRUM Features
- **Kanban Columns**: To Do, In Progress, Review, Done (customizable)
- **Story Points**: Assign story points to tasks for sprint planning
- **Priority Levels**: High, Medium, Low priority task classification
- **Task Assignment**: Assign tasks to team members
- **Sprint Management**: Organize tasks across different boards/sprints

### 🎨 Design Features
- **Modern UI**: Clean, minimalist design with subtle animations
- **Beautiful Color Scheme**: Optimized for productivity
- **Interactive Elements**: Hover effects, smooth transitions, and visual feedback
- **Accessibility**: Keyboard navigation and screen reader support

### 🖥️ Desktop App Features
- **Single Executable**: No need to start servers manually
- **Native Performance**: Runs as a native desktop application
- **Offline First**: Works completely offline with local database
- **System Integration**: Proper desktop app with menus and shortcuts
- **Cross Platform**: Works on Windows, Mac, and Linux
- **Auto-Updates**: Built-in update mechanism (when configured)

## Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **react-beautiful-dnd** - Drag and drop functionality
- **Axios** - HTTP client for API calls
- **Lucide React** - Beautiful icons
- **CSS3** - Custom styling with CSS variables

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **SQLite3** - Lightweight database
- **UUID** - Unique identifier generation
- **CORS** - Cross-origin resource sharing

## Installation & Setup

### For End Users (Recommended)

**Desktop Application Installer:**

1. **Download the installer**
   - Go to the [Releases](../../releases) page
   - Download the latest `uSCRUM Setup.exe` file

2. **Install the application**
   - Run the downloaded installer
   - Follow the installation wizard prompts
   - The installer will automatically set up the application

3. **Launch the application**
   After installation, you can launch uSCRUM from:
   - **Start Menu**: Search for "uSCRUM" or find it in your programs/recently added list
   - **Desktop**: Run the uSCRUM shortcut
   - **Direct path**: `%LOCALAPPDATA%\Programs\uSCRUM\uSCRUM.exe`

The application runs completely offline and stores all your data locally on your machine.

### For Developers

**Prerequisites:**
- Node.js (version 14 or higher)
- npm or yarn package manager

**Development Setup:**

1. **Clone the repository**
   ```bash
   git clone https://github.com/LeRubix/uSCRUM.git
   cd uSCRUM
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Run in development mode**
   ```bash
   npm run electron-dev
   ```
   This starts the SCRUM Board in development mode with hot reloading.

4. **Build executable (optional)**
   ```bash
   npm run dist
   ```
   Creates a distributable executable in the `dist/` folder.

**Manual Development Setup:**

If you prefer to set up the backend and frontend separately:

1. **Backend Setup**
   ```bash
   cd server
   npm install
   npm run dev
   ```

2. **Frontend Setup** (in a new terminal)
   ```bash
   cd client
   npm install
   npm start
   ```

## Usage

### Getting Started
1. The application will create a default board with sample columns when first launched
2. Use the header to switch between boards or create new ones
3. Click the "+" button in any column to add a new task
4. Drag tasks between columns to change their status
5. Click on any task to edit its details

### Creating Tasks
- **Title**: Required field for task identification
- **Description**: Optional detailed description
- **Assignee**: Person responsible for the task
- **Priority**: High, Medium, or Low priority
- **Story Points**: Estimation points for the task

### Managing Boards
- Create multiple boards for different projects or sprints
- Switch between boards using the dropdown in the header
- Each board maintains its own set of columns and tasks

## API Endpoints

The backend provides a RESTful API:

### Boards
- `GET /api/boards` - Get all boards
- `GET /api/boards/:id` - Get specific board with columns and tasks
- `POST /api/boards` - Create new board

### Tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `PUT /api/tasks/:id/move` - Move task between columns
- `DELETE /api/tasks/:id` - Delete task

### Health Check
- `GET /api/health` - Server health check

## File Structure

```
scrum-board/
├── client/                 # React frontend
│   ├── public/
│   │   ├── components/     # React components
│   │   │   ├── Header.js
│   │   │   ├── Board.js
│   │   │   ├── Column.js
│   │   │   ├── Task.js
│   │   │   ├── TaskModal.js
│   │   │   └── LoadingSpinner.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
├── server/                 # Node.js backend
│   ├── database.js         # SQLite database setup
│   ├── index.js            # Express server
│   └── package.json
├── package.json            # Root package.json
└── README.md
```

## Database Schema

### Tables
- **boards**: Store board information
- **columns**: Store column definitions for each board
- **tasks**: Store task data with relationships to boards and columns

### Relationships
- Boards have many columns
- Columns have many tasks
- Tasks belong to boards and columns

## Customization

### Adding New Columns
Modify the `createDefaultBoard` function in `server/database.js` to add custom columns.

### Styling
The application uses CSS variables for theming. Modify `client/src/index.css` to customize colors and styles.

### Priority Levels
Update the priority options in `client/src/components/TaskModal.js` and corresponding styles.

## Development

### Building for Production
```bash
# Build frontend
cd client
npm run build

# Start production server
cd server
npm start
```

## Troubleshooting

### For End Users

1. **Installation Issues**
   - Make sure you have administrator privileges when running the installer
   - Temporarily disable antivirus software if it blocks the installer
   - Try running the installer in compatibility mode if you're on an older Windows version

2. **Application Won't Start**
   - Check if the application is already running in the system tray
   - Try running as administrator: Right-click the desktop shortcut → "Run as administrator"
   - Restart your computer and try again

3. **Data/Tasks Missing**
   - Your data is stored locally in: `%APPDATA%\uSCRUM\`
   - The application creates a new database if none exists
   - To reset all data, close the app and delete the database file in the above folder

### For Developers

1. **Port Already in Use**
   - Backend runs on port 5000, frontend on port 3000
   - Change ports in package.json scripts if needed

2. **Database Issues**
   - Delete `server/scrum_board.db` to reset the database
   - Restart the server to recreate tables

3. **Dependencies Issues**
   - Run `npm run install-all` to reinstall all dependencies
   - Clear npm cache: `npm cache clean --force`


## Contributing

Feel free to contribute to this project, but all builds must be open source.

## License

This project is open source and available under the GNU GENERAL PUBLIC LICENSE.

<br>

## Footnotes

Thank you for checking out uSCRUM, I hope you enjoy it! <br>
This is my first attempt at a truly modern and sleek web frontend application. Like most of my projects, I made it because it was something I wanted to use myself, so I hope anyone who sees this finds it useful and a pleasure to use as well :) <br>

*(Part of this readme was written using AI, Nothing within the actual program is AI generated, and I can assure high-quality usage as this is a program I use myself)*
