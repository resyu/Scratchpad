/*
 * @Author: your name
 * @Date: 2019-09-17 13:26:30
 * @LastEditTime : 2020-01-13 20:19:14
 * @LastEditors  : Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \scratchpad\main.js
 */
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
  ipcMain.on('save', (event) => {
    const options = {
      title: '文件另存为',
      filters: [{
        name: 'javaScript',
        extensions: ['js', 'es6', 'mjs', 'pac']
      }]
    }
    dialog.showSaveDialog(options, function (filename) {
      event.sender.send('saved-file', filename)
    })
  })
  // ipcMain.on('save', () => {
  //   dialog.showSaveDialog({
  //     title: '文件另存为',
  //     filters: [{
  //       name: 'javaScript',
  //       extensions: ['js', 'es6', 'mjs', 'pac']
  //     }]
  //   },(fileName)=>{
  //     console.log(fileName)
  //   })
  // })
})
