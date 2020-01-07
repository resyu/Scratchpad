const {
  ipcRenderer
} = require('electron')
const {
  $
} = require('../../helper')

window.onload = () => {

  // const regReplace = /[^console.log]log|alert/g,
  const regReplace = /console.log|log|alert/g,
    // regReturnMatch = /return\(.*?\)/g,
    // regReturnReplace = /return\(|\)/g,
    regMatch = /.*?console.log\(.*?\).*?|.*?log\(.*?\).*?|.*?alert\(.*?\).*?/g

  let oEdit = $("#edit"),
    oResult = $("#result"),
    oTip_txt = $(".tip_txt"),
    aGetConsoleForLine = [],
    aGetConsoleForLineBack = [],
    editor,
    aItemOutput = [], //分段输出
    sResult = '', //最终输出
    delog = {}

  initFun()

  //行列
  editor.on('cursorActivity', () => {
    let pos = editor.getCursor()
    $('#state').innerHTML = `行 ${pos.line+1}，列 ${pos.ch}`
  })
  //resize
  window.addEventListener('resize', () => {
    initContentDivFun()
  })
  //init content div
  function initContentDivFun() {
    $('#content').style.height = parseInt(window.innerHeight) - 20 + 'px'
    $('#result').style.height = parseInt(window.innerHeight) - 20 + 'px'
  }
  //初始化草稿纸
  function initFun() {
    initContentDivFun()
    //CodeMirror configer
    editor = CodeMirror.fromTextArea(oEdit, {
      mode: { //模式
        name: 'javascript',
        json: true
      },
      keyMap: "sublime", //快捷键模式
      lineNumbers: true, //行号
      lineWrapping: true, //长文本换行
      styleActiveLine: true, //当前行高亮
      theme: "eclipse", //主题
      foldGutter: true, //代码折叠
      matchBrackets: true, //括号匹配
      gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers"], //代码折叠相关
      showCursorWhenSelecting: true //选中时是否显示光标
    })
    editor.focus()
    if (localStorage.inputValue) editor.setValue(localStorage.inputValue)
    consoleInit()
  }
  //输出
  function consoleFun() {
    let inputStr = editor.getValue()
    if (inputStr) {
      let logKey = inputStr.match(regMatch), //匹配用户 "console || alert"
        codeStr = '' //要执行的code
        logKey && (codeStr = inputStr.replace(regReplace, "console.log")) // 替换成 'console.log'
        aGetConsoleForLine = getLineFun(logKey) // 行号
        delog.log(logKey, 'logKey')
        delog.log(aGetConsoleForLine, 'aGetConsoleForLine')
        runFun(codeStr) // 运行
        delog.log(aItemOutput, 'aItemOutput')
        localStorage.inputValue = inputStr
        for (let i = 0; i < aItemOutput.length; i++) {
          outPutFun(aItemOutput[i], i)
        }
    }
  }
  
  function _joinLog(item) {
    let spanColor = '',
      jsonH = ''
    if (Array.isArray(item)) {
      delog.log('Array')
      for (let a = 0; a < item.length; a++) {
        jsonH += `<span class="blue_txt">${item[a]}</span>，`
      }
      item = `[ ${jsonH.substring(0, jsonH.lastIndexOf('，'))} ]`
    } else if (item === null) {
      delog.log('null')
      spanColor = 'gray_txt'
    } else if (typeof item === 'string') {
      delog.log('string')
      item = `"<span class="blue_txt">${item}</span>"`
    } else if (typeof item === 'boolean') {
      delog.log('boolean')
      spanColor = 'blue_txt'
    } else if (typeof item === 'object') {
      delog.log(item.__proto__.__proto__, 'error')
      if (item.__proto__.__proto__ && item.__proto__.__proto__.name === 'Error') {
        spanColor = 'red_txt error'
      } else {
        if (isJSON(item)) {
          for (let k in item) {
            jsonH += `<span>${k}：</span><span class="red_txt">"${item[k]}"</span>，`
          }
          item = `{ ${jsonH.substring(0, jsonH.lastIndexOf('，'))} }`
          spanColor = 'json_span'
        }
      }
    }
    return {
      spanColor,
      item
    }
  }

  function outPutFun(aItemOutput, index) {
    let _joinItem = '',
      _joinJson = {}
    if (aItemOutput.length > 1) {
      _joinItem = ''
      for (let i=0; i< aItemOutput.length; i++) {
        _joinItem += `<span class="${_joinLog(aItemOutput[i]).spanColor}">${_joinLog(aItemOutput[i]).item}</span> `
      }
      _joinItem = `<span>${_joinItem}</span>`
    } else {
      if (Array.isArray(aItemOutput)) {
        _joinJson = _joinLog(...aItemOutput)
      } else {
        _joinJson = _joinLog(aItemOutput)
      }
      _joinItem = `<span class="${_joinJson.spanColor}">${_joinJson.item}</span>`
    }
    sResult += `<p class="flex-row">${_joinItem}<span class="line_tip">行 ${aGetConsoleForLine[index]+1}</span></p>`
    if (sResult) {
      oTip_txt.style.display = 'none'
      oResult.innerHTML = sResult
    }
    aGetConsoleForLineBack = [].concat(aGetConsoleForLine)
    aGetConsoleForLine.length = 0
    //点击行号跳转到对应的代码
    for (let i = 0; i < $('.line_tip', true).length; i++) {
      $('.line_tip', true)[i].addEventListener('click', () => {
        editor.setCursor(aGetConsoleForLineBack[i])
      })
    }
  }
  function isJSON(str) {
    try {
      let obj = JSON.stringify(str)
      if (typeof obj == 'string' && obj) {
        return true
      } else {
        return false
      }

    } catch (e) {
      return false
    }
  }
  //根据内容获取行号
  function getLineFun(sKey) {
    let aContent = editor.getLineHandle(editor.lineCount() - 1).parent.lines,
      nContent = 0
    delog.log(aContent, 'aContent')
    for (let i = 0; i < sKey.length; i++) {
      for (let j = nContent; j < aContent.length; j++) {
        if (sKey[i] === aContent[j].text) {
          aGetConsoleForLine.push(j)
          // delog.log(j)
          // nContent = j + 1
          break
        }
      }
    }
    return aGetConsoleForLine
  }
  //清屏
  function clearFun() {
    oEdit.innerHTML = ''
    oResult.innerHTML = ''
    oTip_txt.style.display = 'block'
    localStorage.removeItem('inputValue')
    editor.setValue('')
    editor.focus()
  }
  //运行code
  function runFun(code) {
    try {
      Function(code)()
    } catch (error) {
      aItemOutput.push(error)
    }
  }
  //快捷键
  document.onkeydown = function (event) {
    let e = event || window.event,
      kc = e.keyCode || e.charCode

    if (kc === 82 && e.ctrlKey) {
      aItemOutput = []
      consoleFun()
    } else if (kc === 73 && e.ctrlKey) {
      editor.focus()
    } else if (kc === 76 && e.ctrlKey) {
      clearFun()
    } else if (kc === 83 && e.ctrlKey) {
      saveFun()
    }
  }
  function consoleInit() {
    if(!window.console) {
      window.console = {}
    } else {
      delog.log = window.console.log
    }
    window.console.log = (...args) => {
      consoleAgent({
        logType: 'log',
        logs: args
      })
    }
  }
  function consoleAgent(item) {
    aItemOutput.push(item.logs)
    // delog.log(item.logs, 'agent')
  }
  //保存
  function saveFun() {
    ipcRenderer.send('save')
  }
  ipcRenderer.on('saved-file', (event, path) =>{
    if(!path) path = 'no path'
    delog.log(`选择的路径：${path}`)
  })
}
