const path = require('path')

const { BrowserWindow } = require('electron')
const { menubar } = require('menubar')

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    titleBarStyle: 'hidden',
    webPreferences: {
      // preload: path.join(__dirname, 'preload.js')
    }
  })
  mainWindow.loadFile( path.join( __dirname, 'index.html' ) ) 
  mainWindow.webContents.openDevTools()
}


const mb = menubar()

mb.on('ready', () => {
  console.log('app is ready')
  createWindow()

  mb.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') mb.app.quit()
  })
  mb.app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
});