const express = require('express');
const app = express();
const path = require('path');
const db = require('./db-connect.js');
const middle = require('./middleware.js');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const session = require('express-session');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const request = require('request');

app.use(cookieParser());

app.use(session({
	secret: '123456',
	saveUninitialized : true, 
	resave : true,
	cookie: { 
		secure: false,
		maxAge: 24 * 60 * 60 * 1000
	},
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var sess = session;

exports.index = function(req, res) {
	res.json("Works");
}

exports.registerAdmin = function(req, res) {
	var username = req.body.username;
	var password = req.body.password;

	db.query("INSERT INTO admin (id, username, password, role_id) VALUES ('', '"+username+"', '"+password+"', 1)", function(result) {	
		res.json(1);
	});
}

exports.loginAdmin = function(req, res) {
	var username = req.body.username;
	var password = req.body.password;

	db.query("SELECT * FROM admin WHERE username = '"+username+"' AND password = '"+password+"'", function(result) {
		if(result.length) {
			sess.user = result[0];

			db.query("UPDATE admin SET date_login = '"+middle.getDate()+"', time_login = '"+middle.getTime()+"' WHERE id = "+sess.user.id, function(result) {
				console.log("Logged in at " + middle.getDate() + " " + middle.getTime());
			});
			jwt.sign({
				id: result[0].id,
				username: result[0].username,
				role: 'admin'
			},'kuda', {expiresIn: '24h'}, (err, token) => {
	    		res.json({token, response: result[0]});
	      	});
		}
		else {
			console.log(404);
			res.json(404);
		}
	});
}

exports.loginUser = function(req, res) {
	var phone_number = req.body.phone_number;
	var password = req.body.password;

	db.query("SELECT * FROM user_manual WHERE phone_number = '"+phone_number+"' AND password = '"+password+"'", function(result) {
		if(result.length) {
			sess.user = result[0];

			db.query("SELECT id FROM users WHERE phone_number = '"+phone_number+"'", function(result) {
				db.query("INSERT INTO login_user (id, user_id, date, time) VALUES ('', "+result[0].id+", '"+middle.getDate()+"', '"+middle.getTime()+"')", function(result) {
					console.log("Logged in at " + middle.getDate() + " " + middle.getTime());
				});

				jwt.sign({
					id: result[0].id,
					username: result[0].phone_number,
					role: 'user'
				},'kuda', {expiresIn: '24h'}, (err, token) => {
		    		res.json({token, response: result[0]});
		      	});
			});
		}
		else {
			console.log(404);
			res.json(404);
		}
	});
}

exports.getOneMerchant = function(req, res) {
	db.query("SELECT * FROM merchant WHERE id = "+req.query.id, function(result) {
		res.json(result);
	});
}

exports.getMerchant = function(req, res) {
	db.query("SELECT * FROM merchant", function(result) {
		res.json(result);
	});
}

exports.addMerchant = function(req, res) {
	var name = req.body.name;

	db.query("INSERT INTO merchant (id, name) VALUES ('', '"+name+"')", function(result) {	
		res.json(result);
	});
}

exports.editMerchant = function(req, res) {
	var name = req.body.name;
    var image = req.body.image;

	db.query("UPDATE merchant SET name = '"+name+"', image = '"+image+"' WHERE id = "+ req.body.id, function(result) {	
		res.json(result);
	});
}

exports.getOneDeals = function(req, res) {
	db.query("SELECT *, date_format(start_date, '%Y-%m-%d') AS start_date, date_format(end_date, '%Y-%m-%d') AS end_date, date_format(date, '%Y-%m-%d') AS date, date_format(time, '%H:%i:%s') AS time FROM deals WHERE id = "+req.query.id, function(result) {
		res.json(result);
	});
}

exports.getDeals = function(req, res) {
	db.query("SELECT *, date_format(start_date, '%Y-%m-%d') AS start_date, date_format(end_date, '%Y-%m-%d') AS end_date, date_format(date, '%Y-%m-%d') AS date, date_format(time, '%H:%i:%s') AS time FROM deals", function(result) {
		res.json(result);
	});
}

exports.addDeals = function(req, res) {
	var name = req.body.name;
    var merchant_id = req.body.merchant_id;
    var start_date = req.body.start_date;
    var end_date = req.body.end_date;
    var audience_id = req.body.audience_id;
    var description = req.body.description;
    var action = req.body.action;
    var action_link = req.body.action_link;
    var type = req.body.type;
    var category_id = req.body.category_id;
    var hot_deals = req.body.hot_deals;
    var date = middle.getDate();
    var time = middle.getTime();

	db.query("INSERT INTO deals (id, name, audience_id, start_date, end_date, description, action, action_link, merchant_id, type, category_id, hot_deals, date, time) VALUES ('', '"+name+"', '"+audience_id+"', '"+start_date+"', '"+end_date+"', '"+description+"', '"+action+"', '"+action_link+"', '"+merchant_id+"', '"+type+"', '"+category_id+"', '"+hot_deals+"', '"+date+"', '"+time+"')", function(result) {	
		res.json(result);
	});
}

exports.editDeals = function(req, res) {
	var name = req.body.name;
    var merchant_id = req.body.merchant_id;
    var start_date = req.body.start_date;
    var end_date = req.body.end_date;
    var audience_id = req.body.audience_id;
    var description = req.body.description;
    var action = req.body.action;
    var action_link = req.body.action_link;
    var type = req.body.type;
    var category_id = req.body.category_id;
    var hot_deals = req.body.hot_deals;
    var image = req.body.image;
    var banner = req.body.banner;

	db.query("UPDATE deals SET name = '"+name+"', audience_id = '"+audience_id+"', start_date = '"+start_date+"', end_date = '"+end_date+"', description = '"+description+"', action = '"+action+"', action_link = '"+action_link+"', image = '"+image+"', banner = '"+banner+"', merchant_id = "+merchant_id+", type = '"+type+"', category_id = "+category_id+", hot_deals = "+hot_deals+" WHERE id = "+ req.body.id, function(result) {	
		res.json(result);
	});
}

exports.getOneEarn = function(req, res) {
	db.query("SELECT *, date_format(start_date, '%Y-%m-%d') AS start_date, date_format(end_date, '%Y-%m-%d') AS end_date, date_format(date, '%Y-%m-%d') AS date, date_format(time, '%H:%i:%s') AS time FROM earn WHERE id = "+req.query.id, function(result) {
		res.json(result);
	});
}

exports.getEarn = function(req, res) {
	db.query("SELECT *, date_format(start_date, '%Y-%m-%d') AS start_date, date_format(end_date, '%Y-%m-%d') AS end_date, date_format(date, '%Y-%m-%d') AS date, date_format(time, '%H:%i:%s') AS time FROM earn", function(result) {
		res.json(result);
	});
}

exports.addEarn = function(req, res) {
	var name = req.body.name;
    var merchant_id = req.body.merchant_id;
    var start_date = req.body.start_date;
    var end_date = req.body.end_date;
    var audience_id = req.body.audience_id;
    var description = req.body.description;
    var action = req.body.action;
    var action_link = req.body.action_link;
    var type = req.body.type;
    var category_id = req.body.category_id;
    var best_activities = req.body.best_activities;
    var hot_earn = req.body.hot_earn;
    var date = middle.getDate();
    var time = middle.getTime();

	db.query("INSERT INTO earn (id, name, audience_id, start_date, end_date, description, action, action_link, merchant_id, type, category_id, best_activities, hot_earn, date, time) VALUES ('', '"+name+"', '"+audience_id+"', '"+start_date+"', '"+end_date+"', '"+description+"', '"+action+"', '"+action_link+"', "+merchant_id+", '"+type+"', "+category_id+", "+best_activities+", "+hot_earn+", '"+date+"', '"+time+"')", function(result) {	
		res.json(result);
	});
}

exports.editEarn = function(req, res) {
	var name = req.body.name;
    var merchant_id = req.body.merchant_id;
    var start_date = req.body.start_date;
    var end_date = req.body.end_date;
    var audience_id = req.body.audience_id;
    var description = req.body.description;
    var action = req.body.action;
    var action_link = req.body.action_link;
    var type = req.body.type;
    var category_id = req.body.category_id;
    var best_activities = req.body.best_activities;
    var hot_earn = req.body.hot_earn;
    var image = req.body.image;
    var banner = req.body.banner;

	db.query("UPDATE earn SET name = '"+name+"', audience_id = '"+audience_id+"', start_date = '"+start_date+"', end_date = '"+end_date+"', description = '"+description+"', action = '"+action+"', action_link = '"+action_link+"', image = '"+image+"', banner = '"+banner+"', merchant_id = "+merchant_id+", type = '"+type+"', category_id = "+category_id+", best_activities = "+best_activities+", hot_earn = "+hot_earn+" WHERE id = "+ req.body.id, function(result) {	
		res.json(result);
	});
}

exports.getOneWin = function(req, res) {
	db.query("SELECT *, date_format(start_date, '%Y-%m-%d') AS start_date, date_format(end_date, '%Y-%m-%d') AS end_date, date_format(date, '%Y-%m-%d') AS date, date_format(time, '%H:%i:%s') AS time FROM win WHERE id = "+req.query.id, function(result) {
		res.json(result);
	});
}

exports.getWin = function(req, res) {
	db.query("SELECT *, date_format(start_date, '%Y-%m-%d') AS start_date, date_format(end_date, '%Y-%m-%d') AS end_date, date_format(date, '%Y-%m-%d') AS date, date_format(time, '%H:%i:%s') AS time FROM win", function(result) {
		res.json(result);
	});
}

exports.addWin = function(req, res) {
	var name = req.body.name;
    var start_date = req.body.start_date;
    var end_date = req.body.end_date;
    var audience_id = req.body.audience_id;
    var description = req.body.description;
    var point_redeem = req.body.point_redeem;
    var type = req.body.type;
    var category_id = req.body.category_id;
    var hot_win = req.body.hot_win;
    var date = middle.getDate();
    var time = middle.getTime();

	db.query("INSERT INTO win (id, name, audience_id, start_date, end_date, description, point_redeem, type, category_id, hot_win, date, time) VALUES ('', '"+name+"', '"+audience_id+"', '"+start_date+"', '"+end_date+"', '"+description+"', "+point_redeem+", '"+type+"', "+category_id+", "+hot_win+", '"+date+"', '"+time+"')", function(result) {	
		res.json(result);
	});
}

exports.editWin = function(req, res) {
	var name = req.body.name;
    var start_date = req.body.start_date;
    var end_date = req.body.end_date;
    var audience_id = req.body.audience_id;
    var description = req.body.description;
    var point_redeem = req.body.point_redeem;
    var type = req.body.type;
    var category_id = req.body.category_id;
    var hot_win = req.body.hot_win;
    var image = req.body.image;
    var banner = req.body.banner;

	db.query("UPDATE win SET name = '"+name+"', audience_id = '"+audience_id+"', start_date = '"+start_date+"', end_date = '"+end_date+"', description = '"+description+"', image = '"+image+"', banner = '"+banner+"', point_redeem = "+point_redeem+", type = '"+type+"', category_id = "+category_id+", hot_win = "+hot_win+" WHERE id = "+ req.body.id, function(result) {	
		res.json(result);
	});
}

exports.getOneProductDeals = function(req, res) {
	db.query("SELECT *, date_format(start_date, '%Y-%m-%d') AS start_date, date_format(end_date, '%Y-%m-%d') AS end_date, date_format(date, '%Y-%m-%d') AS date, date_format(time, '%H:%i:%s') AS time FROM product_deals WHERE id = "+req.query.id, function(result) {
		res.json(result);
	});
}

exports.getProductDeals = function(req, res) {
	db.query("SELECT *, date_format(start_date, '%Y-%m-%d') AS start_date, date_format(end_date, '%Y-%m-%d') AS end_date, date_format(date, '%Y-%m-%d') AS date, date_format(time, '%H:%i:%s') AS time FROM product_deals", function(result) {
		res.json(result);
	});
}

exports.addProductDeals = function(req, res) {
	var name = req.body.name;
    var merchant_id = req.body.merchant_id;
    var start_date = req.body.start_date;
    var end_date = req.body.end_date;
    var audience_id = req.body.audience_id;
    var description = req.body.description;
    var price = req.body.price;
    var discount = req.body.discount;
    var type = req.body.type;
    var category_id = req.body.category_id;
    var hot_deals = req.body.hot_deals;
    var date = middle.getDate();
    var time = middle.getTime();

	db.query("INSERT INTO product_deals (id, name, audience_id, start_date, end_date, description, price, discount, merchant_id, type, category_id, hot_deals, date, time) VALUES ('', '"+name+"', '"+audience_id+"', '"+start_date+"', '"+end_date+"', '"+description+"', "+price+", "+discount+", "+merchant_id+", '"+type+"', "+category_id+", "+hot_deals+", '"+date+"', '"+time+"')", function(result) {	
		res.json(result);
	});
}

exports.editProductDeals = function(req, res) {
	var name = req.body.name;
    var merchant_id = req.body.merchant_id;
    var start_date = req.body.start_date;
    var end_date = req.body.end_date;
    var audience_id = req.body.audience_id;
    var description = req.body.description;
    var price = req.body.price;
    var discount = req.body.discount;
    var type = req.body.type;
    var category_id = req.body.category_id;
    var hot_deals = req.body.hot_deals;
    var image = req.body.image;
    var banner = req.body.banner;

	db.query("UPDATE product_deals SET name = '"+name+"', audience_id = '"+audience_id+"', start_date = '"+start_date+"', end_date = '"+end_date+"', description = '"+description+"', price = "+price+", discount = "+discount+", image = '"+image+"', banner = '"+banner+"', merchant_id = "+merchant_id+", type = '"+type+"', category_id = "+category_id+", hot_deals = "+hot_deals+" WHERE id = "+ req.body.id, function(result) {	
		res.json(result);
	});
}

exports.getOneAudience = function(req, res) {
	db.query("SELECT * FROM audience WHERE id = "+req.query.id, function(result) {
		res.json(result);
	});
}

exports.getAudience = function(req, res) {
	db.query("SELECT * FROM audience", function(result) {
		res.json(result);
	});
}

exports.addAudience = function(req, res) {
	var name = req.body.name;
    var city = req.body.city;
    var gender = req.body.gender;
    var age_start = req.body.age_start;
    var age_end = req.body.age_end;
    var date = middle.getDate();
    var time = middle.getTime();

	db.query("INSERT INTO audience (id, name, city, gender, age_start, age_end, date, time) VALUES ('', '"+name+"', '"+city+"', '"+gender+"', '"+age_start+"', '"+age_end+"', '"+date+"', '"+time+"')", function(result) {	
		res.json(result);
	});
}

exports.editAudience = function(req, res) {
	var name = req.body.name;
    var city = req.body.city;
    var gender = req.body.gender;
    var age_start = req.body.age_start;
    var age_end = req.body.age_end;

	db.query("UPDATE audience SET name = '"+name+"', city = '"+city+"', gender = '"+gender+"', age_start = '"+age_start+"', age_end = '"+age_end+"' WHERE id = "+ req.body.id, function(result) {	
		res.json(result);
	});
}

exports.getOneCategory = function(req, res) {
	db.query("SELECT * FROM category WHERE id = "+req.query.id, function(result) {
		res.json(result);
	});
}

exports.getCategory = function(req, res) {
	db.query("SELECT * FROM category", function(result) {
		res.json(result);
	});
}

exports.addCategory = function(req, res) {
	var name = req.body.name;

	db.query("INSERT INTO category (id, name) VALUES ('', '"+name+"')", function(result) {	
		res.json(result);
	});
}

exports.editCategory = function(req, res) {
	var name = req.body.name;

	db.query("UPDATE category SET name = '"+name+"' WHERE id = "+ req.body.id, function(result) {	
		res.json(result);
	});
}

exports.getLottery = function(req, res) {
	db.query("SELECT *, date_format(date, '%Y-%m-%d') AS date, date_format(time, '%H:%i:%s') AS time FROM lottery WHERE user_id ="+req.query.user_id, function(result) {
		res.json(result);
	});
}

exports.addLottery = function(req, res) {
	var lottery_code = req.body.lottery_code;
    var user_id = req.body.user_id;
    var date = middle.getDate();
    var time = middle.getTime();

	db.query("INSERT INTO lottery (id, lottery_code, user_id, date, time) VALUES ('', '"+lottery_code+"', '"+user_id+"', '"+date+"', '"+time+"')", function(result) {	
		res.json(result);
	});
}

exports.shuffleLottery = function(req, res) {
	db.query("SELECT *, date_format(date, '%Y-%m-%d') AS date, date_format(time, '%H:%i:%s') AS time FROM lottery", function(result) {
		var participants = result.length;
		var shuffle = Math.floor((Math.random() * participants));
		res.json(result[shuffle]);
	});
}

exports.getOneNews = function(req, res) {
	db.query("SELECT *, date_format(start_date, '%Y-%m-%d') AS start_date, date_format(end_date, '%Y-%m-%d') AS end_date, date_format(date, '%Y-%m-%d') AS date, date_format(time, '%H:%i:%s') AS time FROM news WHERE id = "+req.query.id, function(result) {
		res.json(result);
	});
}

exports.getNews = function(req, res) {
	db.query("SELECT *, date_format(start_date, '%Y-%m-%d') AS start_date, date_format(end_date, '%Y-%m-%d') AS end_date, date_format(date, '%Y-%m-%d') AS date, date_format(time, '%H:%i:%s') AS time FROM news", function(result) {
		res.json(result);
	});
}

exports.addNews = function(req, res) {
	var title = req.body.title;
    var start_date = req.body.start_date;
    var end_date = req.body.end_date;
    var source = req.body.source;
    var description = req.body.description;
    var source_link = req.body.source_link;
    var point = req.body.point;
    var hot_entertainment = req.body.hot_entertainment;
    var date = middle.getDate();
    var time = middle.getTime();

	db.query("INSERT INTO news (id, title, start_date, end_date, source, description, source_link, point, hot_entertainment, date, time) VALUES ('', '"+title+"', '"+start_date+"', '"+end_date+"', '"+source+"', '"+description+"', '"+source_link+"', '"+point+"', "+hot_entertainment+", '"+date+"', '"+time+"')", function(result) {	
		res.json(result);
	});
}

exports.editNews = function(req, res) {
	var title = req.body.title;
    var start_date = req.body.start_date;
    var end_date = req.body.end_date;
    var source = req.body.source;
    var description = req.body.description;
    var source_link = req.body.source_link;
    var point = req.body.point;
    var hot_entertainment = req.body.hot_entertainment;
    var image = req.body.image;
    var banner = req.body.banner;

	db.query("UPDATE news SET title = '"+title+"', start_date = '"+start_date+"', end_date = '"+end_date+"', source = '"+source+"', description = '"+description+"', source_link = '"+source_link+"', point = '"+point+"', hot_entertainment = '"+hot_entertainment+"', image = '"+image+"', banner = '"+banner+"' WHERE id = "+ req.body.id, function(result) {	
		res.json(result);
	});
}

exports.getOneStream = function(req, res) {
	db.query("SELECT *, date_format(start_date, '%Y-%m-%d') AS start_date, date_format(end_date, '%Y-%m-%d') AS end_date, date_format(date, '%Y-%m-%d') AS date, date_format(time, '%H:%i:%s') AS time FROM stream WHERE id = "+req.query.id, function(result) {
		res.json(result);
	});
}

exports.getStream = function(req, res) {
	db.query("SELECT *, date_format(start_date, '%Y-%m-%d') AS start_date, date_format(end_date, '%Y-%m-%d') AS end_date, date_format(date, '%Y-%m-%d') AS date, date_format(time, '%H:%i:%s') AS time FROM stream", function(result) {
		res.json(result);
	});
}

exports.addStream = function(req, res) {
	var title = req.body.title;
    var start_date = req.body.start_date;
    var end_date = req.body.end_date;
    var video_url = req.body.video_url;
    var point = req.body.point;
    var hot_entertainment = req.body.hot_entertainment;
    var date = middle.getDate();
    var time = middle.getTime();

	db.query("INSERT INTO stream (id, title, start_date, end_date, video_url, point, hot_entertainment, date, time) VALUES ('', '"+title+"', '"+start_date+"', '"+end_date+"', '"+video_url+"', '"+point+"', "+hot_entertainment+", '"+date+"', '"+time+"')", function(result) {	
		res.json(result);
	});
}

exports.editStream = function(req, res) {
	var title = req.body.title;
    var start_date = req.body.start_date;
    var end_date = req.body.end_date;
    var video_url = req.body.video_url;
    var point = req.body.point;
    var hot_entertainment = req.body.hot_entertainment;
    var image = req.body.image;
    var banner = req.body.banner;

	db.query("UPDATE stream SET title = '"+title+"', start_date = '"+start_date+"', end_date = '"+end_date+"', video_url = '"+video_url+"', point = '"+point+"', hot_entertainment = "+hot_entertainment+", image = '"+image+"', banner = '"+banner+"' WHERE id = "+ req.body.id, function(result) {	
		res.json(result);
	});
}

exports.getOneEvent = function(req, res) {
	db.query("SELECT *, date_format(start_date, '%Y-%m-%d') AS start_date, date_format(end_date, '%Y-%m-%d') AS end_date, date_format(date, '%Y-%m-%d') AS date, date_format(time, '%H:%i:%s') AS time FROM event WHERE id = "+req.query.id, function(result) {
		res.json(result);
	});
}

exports.getEvent = function(req, res) {
	db.query("SELECT *, date_format(start_date, '%Y-%m-%d') AS start_date, date_format(end_date, '%Y-%m-%d') AS end_date, date_format(date, '%Y-%m-%d') AS date, date_format(time, '%H:%i:%s') AS time FROM event", function(result) {
		res.json(result);
	});
}

exports.addEvent = function(req, res) {
	var title = req.body.title;
    var start_date = req.body.start_date;
    var end_date = req.body.end_date;
    var description = req.body.description;
    var location = req.body.location;
    var action = req.body.action;
    var action_link = req.body.action_link;
    var audience_id = req.body.audience_id;
    var point = req.body.point;
    var hot_entertainment = req.body.hot_entertainment;
    var date = middle.getDate();
    var time = middle.getTime();

	db.query("INSERT INTO event (id, title, start_date, end_date, description, location, action, action_link, audience_id, point, hot_entertainment, date, time) VALUES ('', '"+title+"', '"+start_date+"', '"+end_date+"', '"+description+"', '"+location+"', '"+action+"', '"+action_link+"', '"+audience_id+"','"+point+"', "+hot_entertainment+", '"+date+"', '"+time+"')", function(result) {	
		res.json(result);
	});
}

exports.editEvent = function(req, res) {
	var title = req.body.title;
    var start_date = req.body.start_date;
    var end_date = req.body.end_date;
    var description = req.body.description;
    var location = req.body.location;
    var action = req.body.action;
    var action_link = req.body.action_link;
    var audience_id = req.body.audience_id;
    var point = req.body.point;
    var hot_entertainment = req.body.hot_entertainment;
    var image = req.body.image;
    var banner = req.body.banner;

	db.query("UPDATE event SET title = '"+title+"', start_date = '"+start_date+"', end_date = '"+end_date+"', description = '"+description+"', location = '"+location+"', action = '"+action+"', action_link = '"+action_link+"', audience_id = '"+audience_id+"', point = '"+point+"', hot_entertainment = "+hot_entertainment+", image = '"+image+"', banner = '"+banner+"' WHERE id = "+ req.body.id, function(result) {	
		res.json(result);
	});
}

exports.getOneHoroscope = function(req, res) {
	db.query("SELECT *, date_format(start_date, '%Y-%m-%d') AS start_date, date_format(end_date, '%Y-%m-%d') AS end_date, date_format(date, '%Y-%m-%d') AS date, date_format(time, '%H:%i:%s') AS time FROM horoscope WHERE id = "+req.query.id, function(result) {
		res.json(result);
	});
}

exports.getHoroscope = function(req, res) {
	db.query("SELECT *, date_format(start_date, '%Y-%m-%d') AS start_date, date_format(end_date, '%Y-%m-%d') AS end_date, date_format(date, '%Y-%m-%d') AS date, date_format(time, '%H:%i:%s') AS time FROM horoscope", function(result) {
		res.json(result);
	});
}

exports.addHoroscope = function(req, res) {
	var title = req.body.title;
    var start_date = req.body.start_date;
    var end_date = req.body.end_date;
    var zodiac_sign = req.body.zodiac_sign;
    var description = req.body.description;
    var point = req.body.point;
    var hot_entertainment = req.body.hot_entertainment;
    var date = middle.getDate();
    var time = middle.getTime();

	db.query("INSERT INTO horoscope (id, title, start_date, end_date, zodiac_sign, description, point, hot_entertainment, date, time) VALUES ('', '"+title+"', '"+start_date+"', '"+end_date+"', '"+zodiac_sign+"', '"+description+"', '"+point+"', "+hot_entertainment+", '"+date+"', '"+time+"')", function(result) {	
		res.json(result);
	});
}

exports.editHoroscope = function(req, res) {
	var title = req.body.title;
    var start_date = req.body.start_date;
    var end_date = req.body.end_date;
    var zodiac_sign = req.body.zodiac_sign;
    var description = req.body.description;
    var point = req.body.point;
    var hot_entertainment = req.body.hot_entertainment;
    var image = req.body.image;
    var banner = req.body.banner;

	db.query("UPDATE horoscope SET title = '"+title+"', start_date = '"+start_date+"', end_date = '"+end_date+"', zodiac_sign = '"+zodiac_sign+"', description = '"+description+"', point = '"+point+"', hot_entertainment = "+hot_entertainment+", image = '"+image+"', banner = '"+banner+"' WHERE id = "+ req.body.id, function(result) {	
		res.json(result);
	});
}

exports.getOneVoucher = function(req, res) {
	db.query("SELECT * FROM voucher WHERE id = "+req.query.id, function(result) {
		res.json(result);
	});
}

exports.getVoucher = function(req, res) {
	db.query("SELECT * FROM voucher", function(result) {
		res.json(result);
	});
}

exports.addVoucher = function(req, res) {
	var type = req.body.type;
    var vendor = req.body.vendor;
    var merchant = req.body.merchant;
    var product_code = req.body.product_code;
    var product_value = req.body.product_value;
    var price = req.body.price;
    var dealio_points = req.body.dealio_points;

	db.query("INSERT INTO voucher (id, type, vendor, merchant, product_code, product_value, price, dealio_points) VALUES ('', '"+type+"', '"+vendor+"', '"+merchant+"', '"+product_code+"', '"+product_value+"', "+price+", "+dealio_points+")", function(result) {	
		res.json(result);
	});
}

exports.editVoucher = function(req, res) {
	var type = req.body.type;
    var vendor = req.body.vendor;
    var merchant = req.body.merchant;
    var product_code = req.body.product_code;
    var product_value = req.body.product_value;
    var price = req.body.price;
    var dealio_points = req.body.dealio_points;
    var image = req.body.image;

	db.query("UPDATE voucher SET type = '"+type+"', vendor = '"+vendor+"', merchant = '"+merchant+"', product_code = '"+product_code+"', product_value = '"+product_value+"', price = "+price+", dealio_points = "+dealio_points+", image = '"+image+"' WHERE id = "+ req.body.id, function(result) {	
		res.json(result);
	});
}

exports.postImage = function(req, res) {
	if(req.file) {
		res.json(req.file);
	}
	else {
		res.json(404);
	}
}

exports.postBanner = function(req, res) {
	if(req.file) {
		res.json(req.file);
	}
	else {
		res.json(404);
	}
}

exports.postMerchantImage = function(req, res) {
	if(req.file) {
		res.json(req.file);
	}
	else {
		res.json(404);
	}
}

exports.userRegisterPhone = function(req, res) {
	var phone_number = req.body.phone_number;
	var status_regis = 0;
	var date = middle.getDate();
	var time = middle.getTime();

	db.query("SELECT * FROM regis_phone_number WHERE phone_number = '"+phone_number+"' AND status_regis = 1", function(result) {
		if(result.length != 0) {
			res.json(404);
		}
		else {
			db.query("SELECT * FROM regis_phone_number WHERE phone_number = '"+phone_number+"' AND status_regis = 0", function(result) {
				if(result.length >= 3) {
					res.json(403);
				}
				else {
					db.query("INSERT INTO regis_phone_number (id, phone_number, status_regis, date, time) VALUES ('', '"+phone_number+"', '"+status_regis+"', '"+date+"', '"+time+"')", function(result) {	
						res.json(result);
					});
				}
			});
		}
	});
}

exports.userRegisterOtp = function(req, res) {
	var regis_phone_number_id = req.body.regis_phone_number_id;
	var otp_code = req.body.otp_code.substr(req.body.otp_code.length-4);
	var date = middle.getDate();
	var time = middle.getTime();

	db.query("INSERT INTO otp_regis (id, regis_phone_number_id, otp_code, date, time) VALUES ('', '"+regis_phone_number_id+"', '"+otp_code+"', '"+date+"', '"+time+"')", function(result) {	
		res.json(result);
	});
}

exports.checkRegisterOtp = function(req, res) {
	var id = req.body.id;
	var otp_code = req.body.otp_code;
	var regis_phone_number_id = req.body.regis_phone_number_id;
	var phone_number = req.body.phone_number;

	db.query("SELECT * FROM otp_regis WHERE id = "+id, function(result) {
		if(result[0].otp_code == otp_code) {
			db.query("UPDATE regis_phone_number SET status_regis = 2 WHERE phone_number = '"+ phone_number+"' AND status_regis = 0", function(result) {	
				db.query("UPDATE regis_phone_number SET status_regis = 1 WHERE id = "+ regis_phone_number_id, function(result) {	
					res.json(200);
				});
			});
		}
		else {
			res.json(403);
		}
	});
}

exports.citcallOtp = function(req, res) {
	db.query("SELECT * FROM regis_phone_number WHERE id = "+req.query.id, function(result) {
		request.post({
			headers: {'Content-Type' : 'application/json', 'Authorization': 'Apikey 5e69e97b699f5c31dcc16c5e63568e3c'},
		  	url: 'http://104.199.196.122/gateway/v3/asynccall',
		  	json: {"msisdn": result[0].phone_number, "gateway":1}
		}, function(error, response, body){
		  console.log(body);
		  res.json({result, body});
		});
	});
}

exports.getOnePhoneRegis = function(req, res) {
	db.query("SELECT *, date_format(date, '%Y-%m-%d') AS date, date_format(time, '%H:%i:%s') AS time FROM regis_phone_number WHERE id = "+req.query.id, function(result) {
		res.json(result);
	});
}

exports.registerUser = function(req, res) {
	var phone_number = req.body.phone_number;
	var name = req.body.name;
	var email = req.body.email;
	var password = req.body.password;
	var login_method = req.body.login_method;
	var date = middle.getDate();
	var time = middle.getTime();

	if(login_method == 'manual') {
		db.query("INSERT INTO user_manual (id, phone_number, email, password, date, time) VALUES ('', '"+phone_number+"', '"+email+"', '"+password+"', '"+date+"', '"+time+"')", function(result) {	
			db.query("INSERT INTO users (id, phone_number, email, name, login_method, date, time) VALUES ('', '"+phone_number+"', '"+email+"', '"+name+"', '"+login_method+"', '"+date+"', '"+time+"')", function(result) {	
				res.json(result);
			});
		});
	}
	else {
		db.query("INSERT INTO users (id, phone_number, email, name, login_method, date, time) VALUES ('', '"+phone_number+"', '"+email+"', '"+name+"', '"+login_method+"', '"+date+"', '"+time+"')", function(result) {	
			res.json(result);
		});
	}
}

exports.userForgetPhone = function(req, res) {
	var phone_number = req.body.phone_number;
	var status_forget = 0;
	var date = middle.getDate();
	var time = middle.getTime();

	db.query("SELECT id FROM user_manual WHERE phone_number = '"+phone_number+"'", function(result) {
		if(result.length) {
			var user_manual_id = result[0].id;

			db.query("SELECT * FROM forget_phone_number WHERE user_manual_id = '"+user_manual_id+"' AND status_forget = 0", function(result) {
				if(result.length >= 3) {
					res.json(403);
				}
				else {
					db.query("INSERT INTO forget_phone_number (id, user_manual_id, status_forget, date, time) VALUES ('', '"+user_manual_id+"', '"+status_forget+"', '"+date+"', '"+time+"')", function(result) {	
						res.json(result);
					});
				}
			});
		}
		else {
			res.json(404);
		}
	});
}

exports.userForgetOtp = function(req, res) {
	var forget_phone_number_id = req.body.forget_phone_number_id;
	var otp_code = req.body.otp_code.substr(req.body.otp_code.length-4);
	var date = middle.getDate();
	var time = middle.getTime();

	console.log(forget_phone_number_id);

	db.query("INSERT INTO otp_forget_password (id, forget_phone_number_id, otp_code, date, time) VALUES ('', "+forget_phone_number_id+", '"+otp_code+"', '"+date+"', '"+time+"')", function(result) {	
		res.json(result);
	});
}

exports.checkForgetOtp = function(req, res) {
	var id = req.body.id;
	var otp_code = req.body.otp_code;
	var forget_phone_number_id = req.body.forget_phone_number_id;
	var user_manual_id = req.body.user_manual_id;

	db.query("SELECT * FROM otp_forget_password WHERE id = "+id, function(result) {
		if(result[0].otp_code == otp_code) {
			db.query("UPDATE forget_phone_number SET status_forget = 2 WHERE user_manual_id = '"+ user_manual_id+"' AND status_forget = 0", function(result) {	
				db.query("UPDATE forget_phone_number SET status_forget = 1 WHERE id = "+ forget_phone_number_id, function(result) {	
					res.json(200);
				});
			});
		}
		else {
			res.json(403);
		}
	});
}

exports.citcallForgetOtp = function(req, res) {
	db.query("SELECT user_manual_id FROM forget_phone_number WHERE id = "+req.query.id, function(result) {
		db.query("SELECT * FROM user_manual WHERE id = '"+result[0].user_manual_id+"'", function(result) {
			request.post({
				headers: {'Content-Type' : 'application/json', 'Authorization': 'Apikey 5e69e97b699f5c31dcc16c5e63568e3c'},
			  	url: 'http://104.199.196.122/gateway/v3/asynccall',
			  	json: {"msisdn": result[0].phone_number, "gateway":1}
			}, function(error, response, body){
			  console.log(body);
			  res.json({result, body});
			});
		});
	});
}

exports.forgetPasswordUser = function(req, res) {
	var password = req.body.password;
	db.query("SELECT user_manual_id FROM forget_phone_number WHERE id = "+req.body.id, function(result) {
		db.query("UPDATE user_manual SET password = '"+password+"' WHERE id = "+ result[0].user_manual_id, function(result) {	
			res.json(result);
		});
	});	
}

exports.authGoogle = function(req, res) {
	var access_token = req.body.access_token;
	request.get({
		url: 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=' + access_token
	}, 	function(error, response, body){
  			body = JSON.parse(body);
  			console.log(body);
  			var google_id = body.id;
  			var full_name = body.name;
  			var given_name = body.given_name;
  			var family_name = body.family_name;
  			var image_url = body.picture;
  			var email = body.email;
  			var date = middle.getDate();
			var time = middle.getTime();
  			db.query("INSERT INTO user_google (id, google_id, full_name, given_name, family_name, image_url, email, date, time) VALUES ('', '"+google_id+"', '"+full_name+"', '"+given_name+"', '"+family_name+"', '"+image_url+"', '"+email+"', '"+date+"', '"+time+"')", function(result) {	
				res.json(result);
			});
		}
	);
}

exports.getUserGoogle = function(req, res) {
	db.query("SELECT *, date_format(date, '%Y-%m-%d') AS date, date_format(time, '%H:%i:%s') AS time FROM user_google WHERE id = "+req.query.id, function(result) {
		res.json(result);
	});
}

exports.setQrcode = function(req, res) {
	var qrcode =  '8008' + '9939' + 1 + Math.floor(1000 + Math.random() * 9000);
	res.json(qrcode);
}

exports.logout = function(req, res) {
	db.query("UPDATE admin SET date_logout = '"+middle.getDate()+"', time_logout = '"+middle.getTime()+"' WHERE id = "+sess.user.id, function(result) {
		console.log("Logged out at " + middle.getDate() + " " + middle.getTime());
		sess = session;
		res.json(1);
	});
}