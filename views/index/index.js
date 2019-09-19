window.onload = function () {

  const regReplace = /console.log|log/g,
    regMatch = /console.log\(.*?\)|log\(.*?\)/g

  let oEdit = document.querySelector("#edit"),
    oResult = document.querySelector("#result"),
    oRun = document.querySelector("#run_btn"),
    oClear = document.querySelector("#clear_btn"),
    oSave = document.querySelector("#save_btn"),
    aGetConsoleForLine = [],
    aGetConsoleForLineBack = [],
    editor

  initFun()
  //运行
  oRun.onclick = function () {
    consoleFun();
  }
  //清屏
  oClear.onclick = function () {
    clearFun()
  }
  //保存
  oSave.onclick = function () {
    saveFun()
  }
  //行列
  editor.on('cursorActivity', function () {
    let pos = editor.getCursor()
    document.querySelector('#state').innerHTML = `行 ${pos.line+1}，列 ${pos.ch}`
  })
  //resize
  window.addEventListener('resize', function () {
    initContentDivFun()
  })
  //init content div
  function initContentDivFun() {
    document.querySelector('#content').style.height = parseInt(window.innerHeight) - 30 + 'px'
    document.querySelector('#result').style.height = parseInt(window.innerHeight) - 30 + 'px'
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

      if (logKey != null && logKey.length > 1) { //多个输出
        aTempStr = inputStr.trim().split(regMatch) //按"console.log()"拆分
        aGetConsoleForLine = getLineFun(logKey)
        for (let i = 0; i < logKey.length; i++) {
          //得到要运行的分段字符串
          sContentTemp += aTempStr[i]
          itemInput = sContentTemp.concat(logKey[i]).replace(regReplace, "return")
          //运行代码并把输出赋给aItemOutput
          sCodeRun = runFun(itemInput)
          sCodeRun && aItemOutput.push(sCodeRun)
        }
      } else { //单个输出
        let codeStr = inputStr.replace(regReplace, "return") //要执行的code
        aGetConsoleForLine = getLineFun(logKey)
        sCodeRun = runFun(codeStr)
        sCodeRun && aItemOutput.push(sCodeRun)
      }
      localStorage.inputValue = inputStr
      for (let i = 0; i < aItemOutput.length; i++) {
        sResult += `<p class="flex-row"><span>${aItemOutput[i]}</span><span class="line_tip">行 ${aGetConsoleForLine[i]+1}</span></p>`
      }
      sResult && (oResult.innerHTML = sResult)
      aGetConsoleForLineBack = [].concat(aGetConsoleForLine)
      aGetConsoleForLine.length = 0
      //点击行号跳转到对应的代码
      for (let i = 0; i < document.querySelectorAll('.line_tip').length; i++) {
        document.querySelectorAll('.line_tip')[i].addEventListener('click', function () {
          editor.setCursor(aGetConsoleForLineBack[i])
        })
      }
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
    console.log('save')
  }
}