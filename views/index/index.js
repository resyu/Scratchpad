window.onload = function () {

  const regReplace = /console.log|log/g,
    regMatch = /console.log\(.*?\)|log\(.*?\)/g

  let oEdit = document.querySelector("#edit"),
    oResult = document.querySelector("#result"),
    oRun = document.querySelector("#run_btn"),
    oClear = document.querySelector("#clear_btn"),
    oFocus = document.querySelector("#focus_btn"),
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
  //获得焦点
  oFocus.onclick = function () {
    editor.focus()
  }
  //初始化草稿纸
  function initFun() {
    //CodeMirror configer
    editor = CodeMirror.fromTextArea(oEdit, {
      mode: {
        name: 'javascript',
        json: true
      },
      keyMap: "sublime",
      lineNumbers: true,
      lineWrapping: true,
      styleActiveLine: true,
      theme: "eclipse",
      foldGutter: true,
      matchBrackets: true,
      gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers"],
      showCursorWhenSelecting: true
    })
    editor.focus()
    if (localStorage.inputValue) editor.setValue(localStorage.inputValue)
  }
  //输出
  function consoleFun() {
    let inputStr = editor.getValue()
    if (inputStr) {
      let itemInput = '', //分段
        aTempStr = [], //中间件
        aItemOutput = [], //分段输出
        sResult = '', //最终输出
        logKey = inputStr.match(regMatch) //匹配"console.log()"

      if (logKey.length > 1) { //多个输出
        aTempStr = inputStr.trim().split(regMatch) //按"console.log()"拆分
        for (let i = 0; i < aTempStr.length; i++) {
          //得到要运行的分段字符串
          itemInput = itemInput.concat(aTempStr[i].toString().concat(logKey[i]).replace(regReplace, "return"))
          //运行代码并把输出赋给aItemOutput
          runFun(itemInput) && aItemOutput.push(runFun(itemInput))
          itemInput = aTempStr[i].toString()
        }
        for (let i = 0; i < aItemOutput.length; i++) {
          sResult += `${aItemOutput[i]}<br />`
        }
      } else { //单个输出
        let codeStr = inputStr.replace(regReplace, "return") //要执行的code
        sResult = runFun(codeStr)
      }
      localStorage.inputValue = inputStr
      sResult && (oResult.innerHTML = sResult)
    }
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
      alert(error)
    }
  }
  //快捷键
  document.onkeydown = function (event) {
    let e = event || window.event,
      kc = e.keyCode || e.charCode;
    if (kc === 82 && e.ctrlKey) {
      consoleFun()
    }
    if (kc === 73 && e.ctrlKey) {
      editor.focus()
    }
    if (kc === 76 && e.ctrlKey) {
      clearFun()
    }
  }
}