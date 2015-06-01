var express 	= require('express')
var app 	= express();
var path	= require('path');
var http 	= require('http').Server(app);
var io 		= require('socket.io')(http);
var users 	= {};	// 所有人
var mysql      	= require('mysql');

var aRoom_Id		= [];
var sRoom_Id 		= '';	// 房間名稱

var aUser_Room_Id	= [];   // user 在哪間房間
var aUser_Nick_Name	= [];	// user 暱稱

var aRoom_Nick_Name	= [];   // 房間裡有哪些暱稱
var aRoom_All_User	= [];   // 房間中全部的人

var aBan_User		= []	// 被禁言的User

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

app.get('/index', function(req, res){


	sRoom_Id = req.query.room_id;


	res.sendFile(__dirname + '/index.html');


});

io.on('connection', function(socket){

	/**
	 * 	判斷聊天室是否開放
	 */
	function check_room(sRoom_Id)
	{
		if (sRoom_Id == '123' || sRoom_Id == '789')
		{
			return true;
		}
		else
		{
			return false;
		}
	}

	/**
	 * 	取得房中所有成員( 回傳暱稱 )
	 */
	function get_all_room_members(sRoom_Id, sNamespace)
	{
		var aRoom_Members_Socket_Id = [];
		var sNsp = (typeof sNamespace !== 'string') ? '/' : sNamespace;

	    	for( var member in io.nsps[sNsp].adapter.rooms[sRoom_Id] )
	    	{
	    		if (aUser_Nick_Name[member] == 'null')
	    		{
	    			aUser_Nick_Name[member] = '遊客';
	    		}
        		aRoom_Members_Socket_Id.push(aUser_Nick_Name[member]);
    		}

    		return aRoom_Members_Socket_Id;
	}

	/**
	 * 	取得房中所有成員( 回傳socket_id )
	 */
	function get_all_room_members_socket_id(sRoom_Id, sNamespace)
	{
		var aRoom_Members_Socket_Id = [];
		var sNsp = (typeof sNamespace !== 'string') ? '/' : sNamespace;

	    	for( var member in io.nsps[sNsp].adapter.rooms[sRoom_Id] )
	    	{
        		aRoom_Members_Socket_Id.push(member);
    		}

    		return aRoom_Members_Socket_Id;
	}

	/**
	 * 	sql: insert
	 */
	function insert_into_sql( aData, sTable_Name )
	{
		var sSql = 'INSERT INTO ' + sTable_Name + ' SET ?';
		connection.query(sSql, aData, function(error){
			if(error)
			{
			       console.log('寫入資料失敗！');
			       throw error;
			}
		})
	}

	/**
	 *	檢查是否為管理員
	 */
	function check_manager(sSocket_Id)
	{
		return true;
	}

	/**
	 * 	更新暱稱名單
	 */
	function update_nicknames(sSocket_Id)
	{
		// 取出房間內所有暱稱
		aRoom_All_User = get_all_room_members(aUser_Room_Id[sSocket_Id], '/');

		// 取出房間內所有socket.id
		var aRoom_All_User_Socket_Id = get_all_room_members_socket_id(aUser_Room_Id[sSocket_Id], '/');
		// 判斷是否為管理員
		var bIs_Manager = check_manager(sSocket_Id);

		io.to(aUser_Room_Id[sSocket_Id]).emit('usernames', {nick_name: aRoom_All_User, manager: bIs_Manager, socket_id:aRoom_All_User_Socket_Id });
	}

	/**
	 * 	檢查是否可以發言
	 */
	function can_send_message()
	{
		if ( aBan_User[socket.id] === undefined )
		{
			return true;
		}
		else
		{
			return false;
		}
	}

	/**
	 * 	刪除陣列
	 */
	function delete_socket_connect(sSocket_Id)
	{
		delete aUser_Room_Id[sSocket_Id];
		delete aRoom_Nick_Name[aUser_Nick_Name[sSocket_Id]];
		delete aUser_Nick_Name[sSocket_Id];
	}

	/**
	 * 	回應聊天室是否開放
	 */
	socket.on('check_room_status', function(sRoom_Id, callback){

		// 判斷聊天室是否有開
		var bIs_Open = check_room(sRoom_Id);

		if ( bIs_Open == true )
		{
			callback(true);
		}
		else
		{
			callback(false);
		}
  	});

  	/**
	 * 	登入狀態
	 */
	socket.on('check_login', function(sRoom_Id, callback){

		if ( aUser_Nick_Name[socket.id] !== undefined )
		{
			callback(true);
		}
		else
		{
			callback(false);
		}
  	});

  	/**
  	 * 	連至網頁就需幫遊客加入房間
  	 * 	連接socket
  	 */
  	socket.on('link_socket', function(){
  		// 加入聊天室
  		aUser_Room_Id[socket.id] = sRoom_Id;
		socket.join(aUser_Room_Id[socket.id]);
  	});

	/**
	 * 	新增使用者，如果有相同暱稱不可以登入
	 */
	socket.on('new user', function( sData, callback ){
		/* 判斷房間有無暱稱 */
		if ( (aRoom_Nick_Name[sData] ==  'undefined') || aRoom_Nick_Name[sData] ==  sRoom_Id )
		{
			// 回傳false
			callback(false);
		}
		else
		{
			callback(true);

			aUser_Room_Id[socket.id] = sRoom_Id;

			// 將暱稱加入聊天室
			aRoom_Nick_Name[sData] = sRoom_Id;

			// 連線的暱稱
			aUser_Nick_Name[socket.id] = sData;

			socket.nickname = sData;

			socket.join(aUser_Room_Id[socket.id]);

			users[socket.id]	= socket;

			// 更新線上名單
			update_nicknames(socket.id);
		}
	});

	/**
	 * 	禁止使用者留言
	 */
	socket.on('ban_user', function( sSocket_Id ){
		aBan_User[sSocket_Id] = sSocket_Id;
	})

	/**
	 *	開放使用者留言
	 */
	socket.on('release_user', function( sSocket_Id ){
		console.log(sSocket_Id);
		delete aBan_User[sSocket_Id];
	})

	/**
	 * 	訊息傳遞
	 */
	socket.on('chat message', function(sMsg, callback){

		// 禁言判斷
		if ( can_send_message() )
		{
			var sMsg = sMsg.trim();
			// 避免發出空白訊息
			if ( sMsg.length > 0 )
			{
				// 訊息產生
				var nUnix_Time = Math.round((new Date()).getTime() / 1000);
				var display = new Date();
				var sDisplay_time = display.toLocaleTimeString();

				io.to(aUser_Room_Id[socket.id]).emit('chat message', {msg: sMsg, nick_name: aUser_Nick_Name[socket.id], display_time: sDisplay_time});

				var sData =
				{
					nick_name	: aUser_Nick_Name[socket.id],
					content 	: sMsg,
					createdate	: nUnix_Time
				}

				insert_into_sql(sData, 'chat_content');
			}

		}
		else
		{
			users[socket.id].emit('system', {msg: '您已經被禁言', nick_name: 'system'});
		}

  	});

	/**
	 * 	使用者離開
	 */
  	socket.on('disconnect', function(){
  		if ( !aUser_Nick_Name[socket.id] ) return;

  		// 離線訊息
  		io.emit('system', {msg: aUser_Nick_Name[socket.id] + '離線了!' , nick_name: 'system'});

  		delete_socket_connect(socket.id);

  		// 將人員從名單中剔除
  		delete users[socket.id];

		// 更新線上名單
  		update_nicknames();

  		socket.leave(socket.room);
  	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});
