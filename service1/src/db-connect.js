var mysql = require('mysql');

var con = mysql.createConnection({
  host: "190.168.0.6",
  user: "dealioapi",
  password: "dealioteam",
  database: "dealio"
});

exports.query = function(query, callback) {
  con.query(query, function (err, result, fields) {
    if (err) 
    	throw err;
    if (callback)
    	return callback(result);
  });
}