const path = require('path')

const { BrowserWindow } = require('electron')
const { menubar } = require('menubar')


function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 960,
    height: 800,
    titleBarStyle: 'hidden',
    webPreferences: {
      // preload: path.join(__dirname, 'preload.js')
    }
  })

  let TOOLS = process.env.DEV_TOOLS 
  let PROD = process.env.NODE_ENV == 'production'
  let DEV = process.env.NODE_ENV == 'development'
  let FUNC = 'loadURL'
  let ARG = 'http://localhost:5000'

  if ( PROD ) {
    FUNC = 'loadFile'
    ARG = path.join( __dirname, 'index.html' )
  }
  console.log(`[electron] 🍄  NODE_ENV=${process.env.NODE_ENV}, using ${FUNC} with ${ARG}`)

  try {
    mainWindow[ FUNC ]( ARG )
  } catch(err) {
    console.error(`[electron] ❌  error using ${FUNC}`, err)
  }

  console.log(TOOLS, process.env.DEV_TOOLS, DEV)
  if ( DEV || TOOLS ) mainWindow.webContents.openDevTools({ detached: true })
}


const mb = menubar({
  showDockIcon: true
})

mb.on('ready', () => {
  console.log(`[electron] ✅  app is ready`)
  createWindow()

  mb.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') mb.app.quit()
  })
  mb.app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
});