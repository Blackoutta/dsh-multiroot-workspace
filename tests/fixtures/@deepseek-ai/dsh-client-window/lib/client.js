window.__ModuleLoader__.load({
  id: 'fixture',
  factory: function (require) {
    const module = { exports: {} }
    const exports = module.exports
    function readWindowWidth() { return window.innerWidth }
    exports.readWindowWidth = readWindowWidth
    return module.exports
  }
})
