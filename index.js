var app 	= require('express')();
var http 	= require('http').Server(app);
var io 		= require('socket.io')(http);
var users 	= {};
var rooms 	= {};

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){

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
		console.log(socket.nickname);
		if ( socket.nickname != 'test' )
		{
			return true;
		}
		else
		{
			return false;
		}
	}

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
			socket.join('room1');

			socket.nickname = data;

			users[socket.nickname]	= socket;
			// 更新線上名單
			update_nicknames();

			// 歡迎訊息
			io.emit('chat message', {msg: '歡迎~~~' + socket.nickname , nick_name: 'system'});
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
					io.emit('chat message', {msg: msg, nick_name: socket.nickname});
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