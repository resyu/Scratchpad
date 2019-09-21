exports.$ = (selector, all) => {
  if (all) {
    return document.querySelectorAll(selector)
  } else {
    return document.querySelector(selector)
  }
}