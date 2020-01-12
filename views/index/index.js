const {
  ipcRenderer
} = require('electron')
const {
  $
} = require('../../helper')

window.onload = () => {
  const regExegesis = /\/\/.*/g, // 注释
    regReplace = /console.log|log|alert/g,
    regMatch = /console.log\(.*\)|log\(.*\)|alert\(.*\)/g,
    // regContent = /(?<=\(('*|"*))([^('*|"*)\)]+)(?=('*|"*)\))/g // 括弧里面的内容
    regContent = /(?<=\()[^\(\)]+(?=\))/g // 括弧里面的内容

  let oEdit = $("#edit"),
    oResult = $("#result"),
    oTip_txt = $(".tip_txt"),
    aGetConsoleForLine = [],
    editor,
    sResult = '', //最终输出
    jLineNum = {},
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

    sResult = ''
    jLineNum = {}
    aGetConsoleForLine.length = 0
    if (inputStr) {
      let logKey = inputStr.replace(regExegesis, '').trim().match(regMatch), //匹配用户 "console || alert"
        codeStr = '' //要执行的code

      if (logKey) {
        logKey && (codeStr = inputStr.replace(regReplace, "console.log")) // 替换成 'console.log'
        aGetConsoleForLine = getLineFun(logKey) // 行号
        localStorage.inputValue = inputStr
        // 内容、行号对应关系
        Function(codeStr)() // 运行
      }
    }
  }

  function _joinLog(item) {
    let spanColor = '',
      jsonH = ''

    if (Array.isArray(item)) {
      for (let a = 0; a < item.length; a++) {
        jsonH += `<span class="blue_txt">${item[a]}</span>，`
      }
      item = `[ ${jsonH.substring(0, jsonH.lastIndexOf('，'))} ]`
    } else if (item === null) {
      spanColor = 'gray_txt'
    } else if (typeof item === 'string') {
      item = `"<span class="blue_txt">${item}</span>"`
    } else if (typeof item === 'boolean') {
      spanColor = 'blue_txt'
    } else if (typeof item === 'object') {
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

  function outPutFun(oItem, _lineno) {
    let _joinItem = '',
      _line = '',
      _lineNumber,
      _joinJson = {}

    // console单项内容大于一个
    if (oItem.length > 1) {
      // 遍历单项，整合结果到_joinItem
      for (let i = 0; i < oItem.length; i++) {
        _joinItem += `<span class="${_joinLog(oItem[i]).spanColor}">${_joinLog(oItem[i]).item}</span> `
      }
      _joinItem = `<span>${_joinItem}</span>`
      _lineNumber = jLineNum[oItem.toString()]
    } else {
      if (Array.isArray(oItem)) {
        _joinJson = _joinLog(...oItem)
        if (typeof oItem[0] === 'object') {
          if (Array.isArray(oItem[0])) {
            _lineNumber = jLineNum[`[${oItem.toString()}]`]
          } else {
            // json
            _lineNumber = jLineNum[JSON.stringify(oItem[0])]
          }
        } else {
          if (typeof oItem[0] === 'string') {
            _lineNumber = jLineNum[`"${oItem}"`]
          } else {
            _lineNumber = jLineNum[oItem]
          }
        }
      } else {
        // error
        _joinJson = _joinLog(oItem)
      }
      _joinItem = `<span class="${_joinJson.spanColor}">${_joinJson.item}</span>`
    }
    // ()、('')、("")、(null)、(undefined)
    if (!oItem.toString()) {
      if (oItem[0] === "") {
        _lineNumber = jLineNum[`""`]
      } else if (oItem[0] === null) {
        _lineNumber = jLineNum[oItem[0]]
      } else {
        _lineNumber = jLineNum[`[]`]
      }
    }
    if (_lineno) {
      _lineNumber = _lineno - 3
    }
    (_lineNumber || _lineNumber === 0) && (_line = `<span class="line_tip" data-n="${_lineNumber}">行 ${_lineNumber+1}</span>`)
    sResult += `<p class="flex-row">${_joinItem}${_line}</p>`
    if (sResult) {
      oTip_txt.style.display = 'none'
      oResult.innerHTML = sResult
    }
    //点击行号跳转到对应的代码
    for (let i = 0; i < $('.line_tip', true).length; i++) {
      $('.line_tip', true)[i].addEventListener('click', (e) => {
        editor.setCursor(parseInt(e.target.dataset.n))
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
    let aContent = editor.getLineHandle(editor.lineCount() - 1).parent.lines

    for (let i = 0; i < sKey.length; i++) {
      for (let j = i; j < aContent.length; j++) {
        if (sKey[i] === aContent[j].text.trim()) {
          aGetConsoleForLine.push(j)
          if (sKey[i].trim().match(regContent)) {
            // ({})、("sd")、(23)、([1,2,3])、(null)、([])、(undefined)、('')、("")、({'d':'we'})
            let conStr = sKey[i].trim().match(/\(.*\)/g).toString().replace(/\(/g, '').replace(/\)/g, '').trim()
            if (conStr) {
              jLineNum[conStr.replace(/'/g, '"')] = j
            } else {
              jLineNum[sKey[i].trim().match(regContent).toString()] = j
            }
          } else {
            // ()
            jLineNum[sKey[i].trim().match(/\(.*\)/g).toString().replace(/\(/g, '[').replace(/\)/g, ']')] = j
          }
          break
        }
      }
    }
    return aGetConsoleForLine
  }

  //清屏
  function clearFun() {
    sResult = ''
    oEdit.innerHTML = ''
    oResult.innerHTML = ''
    oTip_txt.style.display = 'block'
    localStorage.removeItem('inputValue')
    editor.setValue('')
    editor.focus()
  }

  window.onerror = (_message, _filename, _lineno, _colno, error) => {
    if (_filename.indexOf('.js') !== -1) {
      outPutFun({
        'error': '请输入正确的 JavaScript'
      })
    } else {
      outPutFun(error, _lineno)
    }
  }

  //快捷键
  document.onkeydown = function (event) {
    let e = event || window.event,
      kc = e.keyCode || e.charCode

    if (kc === 82 && e.ctrlKey) {
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
    if (!window.console) {
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
    outPutFun(item.logs, false, true)
  }

  //保存
  function saveFun() {
    ipcRenderer.send('save')
  }

  ipcRenderer.on('saved-file', (event, path) => {
    if (!path) path = 'no path'
    delog.log(`选择的路径：${path}`)
  })
}
