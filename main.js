const {
  app,
  BrowserWindow,
  ipcMain,
  dialog
} = require('electron')

class AppWin extends BrowserWindow {
  //构造函数
  constructor(config, fileLocation) {
    const basicConfig = {
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true
      }
    }
    // const finalConfig = Object.assign(basicConfig, config)
    const finalConfig = {
      ...basicConfig,
      ...config
    }
    super(finalConfig)
    fileLocation && (this.loadFile(fileLocation))
    this.once('ready-to-show', () => {
      this.show()
    })
  }
}

app.on('ready', () => {
  const mainWin = new AppWin({
    transparent: true
  }, 'views/index/index.html')
  mainWin.setMenu(null)
  // mainWin.webContents.openDevTools()
  ipcMain.on('save', () => {
    dialog.showSaveDialog({
      title: '文件另存为',
      filters: [{
        name: 'javaScript',
        extensions: ['js', 'es6', 'mjs', 'pac']
      }]
    },(fileName)=>{
      console.log(fileName)
    })
  })
})