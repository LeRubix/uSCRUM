const fs = require('fs');
const path = require('path');


function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

module.exports = async function afterPack(context) {
  const { appOutDir, packager } = context;
  
  console.log('Running afterPack script...');
  console.log('App output directory:', appOutDir);
  
  
  const serverNodeModulesSource = path.join(packager.projectDir, 'server', 'node_modules');
  const serverNodeModulesTarget = path.join(appOutDir, 'resources', 'app', 'server', 'node_modules');
  
  console.log('Source:', serverNodeModulesSource);
  console.log('Target:', serverNodeModulesTarget);
  
  
  if (!fs.existsSync(serverNodeModulesSource)) {
    console.log('Warning: Server node_modules not found at:', serverNodeModulesSource);
    return;
  }
  
  
  if (fs.existsSync(serverNodeModulesTarget)) {
    console.log('Target already exists, skipping copy');
    return;
  }
  
  try {
    console.log('Copying server node_modules...');
    copyDirectory(serverNodeModulesSource, serverNodeModulesTarget);
    console.log('Successfully copied server node_modules');
  } catch (error) {
    console.error('Error copying server node_modules:', error);
    throw error;
  }
}; 