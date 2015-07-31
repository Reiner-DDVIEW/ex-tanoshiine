var caps = require('../server/caps'),
    config = require('./config'),
    common = require('../common'),
    db = require('../db'),
    mainConfig = require('../config'),
    msgcheck = require('../server/msgcheck'),
    okyaku = require('../server/okyaku'),
    recaptcha = require('recaptcha'),
    winston = require('winston'),
    PushBullet = require('pushbullet');

var PB = new PushBullet(config.ACCESS_TOKEN);

const ERRORS = {
	'invalid-site-private-key': "Sorry, the server isn't set up with reCAPTCHA properly.",
	'invalid-request-cookie': "Something went wrong with our reCAPTCHA token. Please try again.",
	'incorrect-captcha-sol': "Incorrect.",
	'captcha-timeout': "Sorry, you took too long. Please try again.",
};

var safe = common.safe;

function report(reporter_ident, op, num, cb) {

	var board = caps.can_access_thread(reporter_ident, op);
	if (!board)
		return cb("Post does not exist.");

	var reporter = maybe_mnemonic(reporter_ident.ip) || '???';

	var yaku = new db.Yakusoku(board, {auth: 'Moderator'});
	var reader = new db.Reader(yaku);
	var kind = op == num ? 'thread' : 'post';
	reader.get_post(kind, num, {}, function (err, post) {
		if (err || !post) {
			if (err)
				console.error(err);
			send_report(reporter, board, op, num, '', [], cb);
			return;
		}

		var name = (post.name || common.ANON)
		if (name.length > 23)
			name = name.slice(0, 20) + '...';
		if (post.trip)
			name += ' # ' + post.trip;
		if (post.ip)
			name += ' # ' + maybe_mnemonic(post.ip);
		var body = 'Offender: ' + name;

		var img;
		if (post.image && !post.hideimg)
			img = image_preview(post.image);
		if (img) {
			body += '\nThumbnail: ' + img.src;
		}

		send_report(reporter, board, op, num, body, cb);
	});
}

function send_report(reporter, board, op, num, body, cb) {
	var noun;
	var url = config.DOMAIN + board + '/' + op + '?reported';
	if (op == num) {
		noun = 'Thread';
	}
	else {
		noun = 'Post';
		url += '#' + num;
	}

	body = body ? (body + '\n\n' + url) : url;

	var title = noun + ' #' + num + ' reported by ' + reporter;
	PB.note(config.CHANNEL_TAG, title, body, function (err, resp) {
		if (err)
			return cb(err);
		cb(null);
	});
}

function image_preview(info) {
	if (!info.dims)
		return;
	var tw = info.dims[2], th = info.dims[3];
	if (info.mid) {
		tw *= 2;
		th *= 2;
	}
	if (!tw || !th) {
		tw = info.dims[0];
		th = info.dims[1];
	}
	if (!tw || !th)
		return;

	mediaURL = require('../imager/config').MEDIA_URL;
 mediaURL = mediaURL.replace(/^\//, "");
	var src;
	if (info.mid)
		src = config.DOMAIN + mediaURL + '/mid/' + info.mid;
	else if (info.thumb)
		src = config.DOMAIN + mediaURL + '/thumb/' + info.thumb;
	else
		return;

	var title = common.readable_filesize(info.size);
	return {src: src, width: tw, height: th, title: title};
}

function maybe_mnemonic(ip) {
	if (ip && mainConfig.IP_MNEMONIC) {
		var authcommon = require('../admin/common');
		ip = authcommon.ip_mnemonic(ip);
	}
	return ip;
}

okyaku.dispatcher[common.REPORT_POST] = function (msg, client) {
	if (!msgcheck.check(['id', 'string', 'string'], msg))
		return false;

	var num = msg[0];
	var op = db.OPs[num];
	if (!op || !caps.can_access_thread(client.ident, op))
		return reply_error("Post does not exist.");

	var data = {
		remoteip: client.ident.ip,
		challenge: msg[1],
		response: msg[2].trim(),
	};
	if (!data.challenge || !data.response)
		return reply_error("Pretty please?");
	if (data.challenge.length > 10000 || data.response.length > 10000)
		return reply_error("tl;dr");

	var checker = new recaptcha.Recaptcha(config.RECAPTCHA_SITE_KEY,
			config.RECAPTCHA_SECRET_KEY, data);
	checker.verify(function (ok, err) {
		if (!ok) {
			reply_error(ERRORS[err] || err);
			return;
		}

		var op = db.OPs[num];
		if (!op)
			return reply_error("Post does not exist.");
		report(client.ident, op, num, function (err) {
			if (err) {
				winston.error(err);
				return reply_error("Couldn't send report.");
			}
			// success!
			client.send([op, common.REPORT_POST, num]);
		});
	});
	return true;

	function reply_error(err) {
		if (!err)
			err = 'Unknown reCAPTCHA error.';
		var op = db.OPs[num] || 0;
		var msg = {status: 'error', error: err};
		client.send([op, common.REPORT_POST, num, msg]);
		return true;
	}
};
