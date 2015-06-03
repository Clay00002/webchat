var login   = $('#login');
var account = $('#account');
var password = $('#password');
var login_error = $('#login_error');

function check_manager_login( sManager_Account, sManager_Password )
{
        var sRoom_Id = $.getParamJquery("room_id");
        $.getJSON('/ajax/ajax_check_manager.php', {manager_account:sManager_Account, manager_password:sManager_Password, room_id:sRoom_Id}, function(json)
        {
                console.log(json);
        });
}

/**
 *      管理員登入判斷
 */
login.submit(function(e){
        e.preventDefault();
        if ( account.val().length > 0 && password.val().length > 0 )
        {
                // 問後端是否有此帳號
                check_manager_login(account.val(), password.val());

                // 加入新的人
                socket.emit('new user', account.val(), function(data){
                        if (data)
                        {
                                $('#send_message').show();
                                $('#manager').hide();
                                $('#login_panel').hide();
                                $('#chat_content').show();
                                $('#message_box').show();
                                $('#login_box').hide();
                                $('.tabs').show();
                                $('#send_message').show();

                        }
                        else
                        {
                                login_error.html('已有相同名稱，請重試一次');
                        }
                });
        }
        else
        {
                login_error.html('請輸入正確帳號密碼');
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
                //
		$('#chat_content').hide();
                $('.tabs').hide();
                $('#manager').hide();
		$('#login_panel').show();
	}
}

function manager_login()
{
        $('#login_panel').hide();

        $('#manager').show();
}