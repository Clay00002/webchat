var express 	= require('express')
var app 	= express();
var path	= require('path');
var http 	= require('http').Server(app);
var io 		= require('socket.io')(http);
var users 	= {};	// 所有人
var user_list	= [];	// 各房間的人
var rooms 	= [];	// 所有房間陣列
var room_name 	= '';	// 房間名稱
var a_nick_name = [];   // 匿名陣列
var mysql      	= require('mysql');

var connection 	= mysql.createConnection({
	host	: 'localhost',
	user	: 'root',
	password: 'q1w2e3r4',
	database: 'webchat'
});

// 建立連線
connection.connect();

// load js
app.use('/js',express.static(path.join(__dirname, 'js')));

// load css
app.use('/css',express.static(path.join(__dirname, 'css')));

function check_room(rooms_name)
{
	// 放進陣列中
	if ( !(rooms_name in rooms) )
	{
		rooms.push(rooms_name);
	}
	return true;
}

app.get('/index', function(req, res){

	if (check_room(req.query.name))
	{
		room_name = req.query.name;
		res.sendFile(__dirname + '/index.html');
	}
	else
	{
		res.sendFile(__dirname + '/404.html');
	}

});

io.on('connection', function(socket){

	/**
	 * 	sql: insert
	 */
	function insert_into_sql( data, table_name )
	{
		var sql = 'INSERT INTO ' + table_name + ' SET ?';

		connection.query(sql, data, function(error){
			if(error)
			{
			       console.log('寫入資料失敗！');
			       throw error;
			}
		})
	}

	/**
	 * 	更新暱稱名單
	 */
	function update_nicknames()
	{
		io.sockets.emit('usernames', Object.keys(users));
	}

	/**
	 * 	檢查是否可以發言
	 */
	function can_send_message()
	{
		if ( socket.nickname != 'test' )
		{
			return true;
		}
		else
		{
			return false;
		}
	}

	io.sockets.emit('usernames', Object.keys(users));

	/**
	 * 	新增使用者，如果有相同暱稱不可以登入
	 */
	socket.on('new user', function( data, callback ){
		if (data in users)
		{
			// 回傳false
			callback(false);
		}
		else
		{
			// 回傳tre
			callback(true);

			// 加入聊天室
			socket.join(room_name);

			socket.nickname = data;

			users[socket.nickname]	= socket;
			// 更新線上名單
			update_nicknames();

			// 歡迎訊息
			//io.emit('chat message', {msg: '歡迎~~~' + socket.nickname , nick_name: 'system'});
		}
	});

	/**
	 * 	訊息傳遞
	 * 	( 訊息符號  名稱  訊息 )
	 * 	/w john message
	 */
	socket.on('chat message', function(msg, callback){

		// 禁言判斷

		if ( can_send_message() )
		{

			var msg = msg.trim();

			// /w 代表要私訊訊息
			if ( msg.substring(0, 3) === '/w ' )
			{
				msg = msg.substring(3);

				// 多於空白
				var index = msg.indexOf(' ');
				if ( index !== -1 )
				{
					var name 	= msg.substring(0, index);
					var msg 	= msg.substring(index + 1);

					// 確定 此暱稱在名單中
					if ( name in users )
					{
						users[socket.nickname].emit('whisper_from_me', {msg: msg, nick_name: socket.nickname});
						users[name].emit('whisper', {msg: msg, nick_name: socket.nickname});
					}
					else
					{
						callback('系統: 錯誤，無此暱稱');
					}

				}
				else
				{
					// 錯誤訊息
					callback('系統: 錯誤，請重新輸入訊息');
				}
			}
			else
			{
				// 大眾發言

				// 避免發出空白訊息
				if ( msg.length > 0 )
				{
					// 訊息產生
					var unix_time = Math.round((new Date()).getTime() / 1000);
					var display = new Date();
					var display_time = display.toLocaleTimeString();
					io.emit('chat message', {msg: msg, nick_name: socket.nickname, display_time: display_time});

					var data = {
						nick_name	: socket.nickname,
						content 	: msg,
						createdate	: unix_time
					}

					insert_into_sql(data, 'chat_content');
				}
			}
		}
		else
		{
			users[socket.nickname].emit('system', {msg: '您已經被進言', nick_name: 'system'});
		}

  	});

	/**
	 * 	使用者離開
	 */
  	socket.on('disconnect', function(){
  		if ( !socket.nickname ) return;

  		// 離線訊息
  		io.emit('chat message', {msg: socket.nickname + '離線了!' , nick_name: 'system'});

  		// 將人員從名單中剔除
  		delete users[socket.nickname];

  		// 更新線上名單
  		update_nicknames();

  		socket.leave(socket.room);
  	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});