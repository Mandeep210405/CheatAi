const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');

let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    fullscreen: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    
  });

  mainWindow.loadFile('index.html');

  let opacity = 1.0;
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'ArrowUp' && opacity < 1.0) {
      opacity += 0.1;
      mainWindow.setOpacity(opacity);
    } else if (input.key === 'ArrowDown' && opacity > 0.2) {
      opacity -= 0.1;
      mainWindow.setOpacity(opacity);
    } else if (input.key === 'Escape') {
      mainWindow.close();
    }
  });
});

ipcMain.on('run-deepseek', (event, userInput) => {
  const deepseek = spawn('ollama', ['run', 'gemma:2b'], { shell: true });

  deepseek.stdin.write(userInput + "\n");
  deepseek.stdin.end();

  // Stream responses in real-time
  deepseek.stdout.on('data', (data) => {
    event.reply('deepseek-response-chunk', data.toString());
  });

  deepseek.stderr.on('data', (data) => {
    console.error(`Error: ${data}`);
  });

  deepseek.on('close', () => {
    event.reply('deepseek-response-end');
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
