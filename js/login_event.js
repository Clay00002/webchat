var login   = $('#login');
var account = $('#account');
var password = $('#password');
var login_error = $('#login_error');

/**
 *      登入判斷
 */
login.submit(function(e){
        e.preventDefault();
        if ( account.val().length > 0 && password.val().length > 0 )
        {
                // 加入新的人
                socket.emit('new user', account.val(), function(data){
                        if (data)
                        {
                                $('#manager').hide();
                                $('#login_panel').hide();
                                $('#chat_content').show();
                                $('#message_box').show();
                                $('#login_box').hide();
                                $('.tabs').show();
                        }
                        else
                        {
                                login_error.html('已有相同名稱，請重試一次');
                        }
                });
        }
        else
        {
                login_error.html('請輸入暱稱');
        }
        nick_name.val('');
});

function is_login()
{
	return false;
}


function login_event()
{
	// 判斷有無登入
	if ( is_login() )
	{
		// 顯示輸入區
		$('#login_box').hide();
		$('#message_box').show();
	}
	else
	{
		// 顯示登入選項
		$('#chat_content').hide();
                $('.tabs').hide();
		$('#login_panel').show();
	}
}

function manager_login()
{
        $('#login_panel').hide();

        $('#manager').show();
}