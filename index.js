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
var aRoom_All_User	= [];   // 房間中全不的人

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

function check_room()
{
	return true;
}

app.get('/index', function(req, res){

	if ( check_room() )
	{
		sRoom_Id = req.query.room_id;


		res.sendFile(__dirname + '/index.html');
	}
	else
	{
		res.sendFile(__dirname + '/404.html');
	}

});

io.on('connection', function(socket){

	function get_all_room_members(sRoom_Id, sNamespace)
	{
		var aRoom_Members_Socket_Id = [];
		var sNsp = (typeof sNamespace !== 'string') ? '/' : sNamespace;

	    	for( var member in io.nsps[sNsp].adapter.rooms[sRoom_Id] )
	    	{
        		aRoom_Members_Socket_Id.push(aUser_Nick_Name[member]);
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
	 * 	更新暱稱名單
	 */
	function update_nicknames(socket_id)
	{
		// 找出誰在房間裡
		aRoom_All_User = get_all_room_members(aUser_Room_Id[socket_id], '/');
		io.to(aUser_Room_Id[socket_id]).emit('usernames', {nick_name: aRoom_All_User});
		//io.sockets.emit('usernames', Object.keys(users));
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


	/**
	 * 	新增使用者，如果有相同暱稱不可以登入
	 */
	socket.on('new user', function( sData, callback ){

		if ( (aRoom_Nick_Name[sData] ==  'undefined') || aRoom_Nick_Name[sData] ==  sRoom_Id)
		{
			// 回傳false
			callback(false);
		}
		else
		{
			// 回傳true
			callback(true);

			aUser_Room_Id[socket.id] = sRoom_Id;

			// 將暱稱加入聊天室
			aRoom_Nick_Name[sData] = sRoom_Id;

			// 連線的暱稱
			aUser_Nick_Name[socket.id] = sData;

			socket.nickname = sData;

			// 加入聊天室
			socket.join(aUser_Room_Id[socket.id]);

			users[socket.id]	= socket;

			// 更新線上名單
			update_nicknames(socket.id);
		}
	});

	/**
	 * 	訊息傳遞
	 * 	( 訊息符號  名稱  訊息 )
	 * 	/w john message
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

				var sData = {
					nick_name	: aUser_Nick_Name[socket.id],
					content 	: sMsg,
					createdate	: nUnix_Time
				}

				insert_into_sql(sData, 'chat_content');
			}

		}
		else
		{
			users[socket.id].emit('system', {msg: '您已經被進言', nick_name: 'system'});
		}

  	});

	/**
	 * 	使用者離開
	 */
  	socket.on('disconnect', function(){
  		if ( !aUser_Nick_Name[socket.id] ) return;

  		// 離線訊息
  		io.emit('chat message', {msg: aUser_Nick_Name[socket.id] + '離線了!' , nick_name: 'system'});

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