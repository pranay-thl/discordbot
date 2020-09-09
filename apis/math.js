const when = require("when");
const math = require("mathjs");
const { resolve, reject } = require("when");

var runtime;
function init(_runtime) {
    runtime = _runtime;
}

function evaluateExpression(expr) {
    return when.promise((resolve, reject) => {
        try {
            let evalRes = math.evaluate(expr);
            return resolve({ data: evalRes });
        }
        catch (err) {
            return resolve({ error: { data: err, msg: err.message } });
        }
    });
}

module.exports = {
    init,
    evaluateExpression
}