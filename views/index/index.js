const {
  ipcRenderer
} = require('electron')
const {
  $
} = require('../../helper')

window.onload = () => {

  const regReplace = /console.log|log|alert/g,
    regMatch = /console.log\(.*?\)|log\(.*?\)|alert\(.*?\)/g

  let oEdit = $("#edit"),
    oResult = $("#result"),
    oTip_txt = $(".tip_txt"),
    aGetConsoleForLine = [],
    aGetConsoleForLineBack = [],
    editor

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
  }
  //输出
  function consoleFun() {
    let inputStr = editor.getValue()
    if (inputStr) {
      let itemInput = '', //分段
        aTempStr = [], //按"console.log()"拆分
        sContentTemp = '', //分段字符串中间件
        aItemOutput = [], //分段输出
        sResult = '', //最终输出
        sCodeRun = '', //代码运行结果
        logKey = inputStr.match(regMatch) //匹配"console.log()"

      if (logKey != null) {
        if (logKey.length > 1) { //多个输出
          aTempStr = inputStr.trim().split(regMatch) //按"console.log()"拆分
          aGetConsoleForLine = getLineFun(logKey)
          for (let i = 0; i < logKey.length; i++) {
            //得到要运行的分段字符串
            sContentTemp += aTempStr[i]
            itemInput = sContentTemp.concat(logKey[i]).replace(regReplace, "return")
            //运行代码并把输出赋给aItemOutput
            sCodeRun = runFun(itemInput)
            aItemOutput.push(sCodeRun)
          }
        } else { //单个输出
          let codeStr = inputStr.replace(regReplace, "return") //要执行的code
          aGetConsoleForLine = getLineFun(logKey)
          sCodeRun = runFun(codeStr)
          aItemOutput.push(sCodeRun)
        }
        localStorage.inputValue = inputStr
        for (let i = 0; i < aItemOutput.length; i++) {
          let spanColor = '',
            jsonH = ''
          if (Array.isArray(aItemOutput[i])) {
            for (let a=0;a<aItemOutput[i].length;a++) {
              jsonH += `<span class="blue_txt">${aItemOutput[i][a]}</span>，`
            }
            aItemOutput[i] = `[ ${jsonH.substring(0, jsonH.lastIndexOf('，'))} ]`
          } else if (aItemOutput[i] == null) {
            spanColor = 'gray_txt'
          } else if (typeof aItemOutput[i] === 'string') {
            aItemOutput[i] = `"<span class="blue_txt">${aItemOutput[i]}</span>"`
          } else if (typeof aItemOutput[i] === 'boolean') {
            spanColor = 'blue_txt'
          } else if (typeof aItemOutput[i] === 'object') {
            if (aItemOutput[i].__proto__.name && aItemOutput[i].__proto__.name === 'ReferenceError') {
              spanColor = 'red_txt error'
            } else {
              if (isJSON(aItemOutput[i])) {
                for (let k in aItemOutput[i]) {
                  jsonH += `<span>${k}：</span><span class="red_txt">"${aItemOutput[i][k]}"</span>，`
                }
                aItemOutput[i] = `{ ${jsonH.substring(0, jsonH.lastIndexOf('，'))} }`
                spanColor = 'json_span'
              }
            }
          }
          sResult += `<p class="flex-row"><span class="${spanColor}">${aItemOutput[i]}</span><span class="line_tip">行 ${aGetConsoleForLine[i]+1}</span></p>`
        }
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
    }
  }

  function isJSON(str) {
    try {
      let obj = JSON.stringify(str);
      if (typeof obj == 'string' && obj) {
        return true;
      } else {
        return false;
      }

    } catch (e) {
      return false;
    }
  }
  //根据内容获取行号
  function getLineFun(sKey) {
    let aContent = editor.getLineHandle(editor.lineCount() - 1).parent.lines,
      nContent = 0
    for (let i = 0; i < sKey.length; i++) {
      for (let j = nContent; j < aContent.length; j++) {
        if (sKey[i] === aContent[j].text) {
          aGetConsoleForLine.push(j)
          nContent = j + 1
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
      return Function(code)()
    } catch (error) {
      return error
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
  //保存
  function saveFun() {
    ipcRenderer.send('save')
  }
}