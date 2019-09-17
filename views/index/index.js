window.onload = function () {

  const regReplace = /console.log|log/g,
    regMatch = /console.log\(.*?\)|log\(.*?\)/g

  let oEdit = document.querySelector("#edit"),
    oResult = document.querySelector("#result"),
    oRun = document.querySelector("#run_btn"),
    oClear = document.querySelector("#clear_btn")

  initFun()
  //运行
  oRun.onclick = function () {
    consoleFun();
  }
  //清屏
  oClear.onclick = function () {
    clearFun()
  }
  //初始化草稿纸
  function initFun() {
    oEdit.focus()
    if (localStorage.inputValue) oEdit.innerText = localStorage.inputValue
  }
  //输出
  function consoleFun() {
    let inputStr = oEdit.innerText
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
    oEdit.focus()
  }
  //运行code
  function runFun(code) {
    return Function(code)()
  }
  //快捷键
  document.onkeydown = function (event) {
    let e = event || window.event,
      kc = e.keyCode || e.charCode;
    if (kc === 82 && e.ctrlKey) {
      consoleFun()
    }
    if (kc === 73 && e.ctrlKey) {
      oEdit.focus()
    }
    if (kc === 76 && e.ctrlKey) {
      clearFun()
    }
  }
}