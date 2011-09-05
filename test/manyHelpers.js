

exports.hello = function(name) {
    return "hello " + name
}

exports.bold = function(contents) {
    return "<b>" + contents() + "</b>"
}