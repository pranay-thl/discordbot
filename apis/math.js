const when = require("when");
const math = require("mathjs");

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
            let err_msg = "Internal Server Error";
            if(err && err.message) {
                err_msg = err.message;
            }
            return resolve({ error: { data: err, msg: err_msg} });
        }
    });
}

module.exports = {
    init,
    evaluateExpression
}