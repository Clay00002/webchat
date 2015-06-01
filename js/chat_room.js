var socket      = io();  // 建立連線
var nick_form   = $('#send_nickname');
var nick_error  = $('#nick_error');
var users       = $('#users');
var nick_name   = $('#nick_name');

/**
 *      禁止user留言
 */
function ban_user(sHtml_Name)
{
        /*
        $('.ban_user' + sHtml_Name).change(function() {
                var $input = $( this );
                console.log($input.prop( "checked"));
                if ($input.prop( "checked"))
                {
                         var sSocket_Id = $('input:checkbox:checked[name="ban_user[' + sHtml_Name + ']"]').val();

                        socket.emit('ban_user', sSocket_Id ,function(data){
                                console.log(data);
                        });
                }
                else
                {
                        var sSocket_Id = $('.ban_user' + sHtml_Name ).val();
                        socket.emit('release_user', sSocket_Id);
                }

        }).change();
        */
        console.log($('.ban_user' + sHtml_Name).prop("checked"));
        if ( $('.ban_user' + sHtml_Name).prop("checked") )
        {
                var sSocket_Id = $('input:checkbox:checked[name="ban_user[' + sHtml_Name + ']"]').val();
                socket.emit('ban_user', sSocket_Id);
        }
        else
        {
                var sSocket_Id = $('.ban_user' + sHtml_Name ).val();
                socket.emit('release_user', sSocket_Id);
        }
}

/**
 *      登入暱稱
 */
nick_form.submit(function(e){
        e.preventDefault();
        if ( nick_name.val().length > 0 )
        {
                // 加入新的人
                socket.emit('new user', nick_name.val(), function(data){
                        if (data)
                        {
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
                                nick_error.html('已有相同名稱，請重試一次');
                        }
                });
        }
        else
        {
                nick_error.html('請輸入帳號密碼');
        }
        nick_name.val('');
});

/**
 *      顯示使用者名稱
 */
socket.on('usernames', function(data){
        var html = '';
        for (var i = 0; i < data.nick_name.length; i++)
        {
                if ( data.manager )
                {
                        // data.socket_id[i]
                        html += data.nick_name[i] + '<input type="checkbox" id="ban_user['+ i +']" name="ban_user['+ i +']" value="' + data.socket_id[i] + '" onChange = "ban_user('+ i +')" class="ban_user' + i + '" ><br/>';
                }
                else
                {
                        html += data.nick_name[i] + '<br/>';
                }
        };

        users.html(html);
});

/**
 *      訊息交換
 */
$('form').submit(function(){
        socket.emit('chat message', $('#m').val(), function(data){
                // error msg
                $('#show_messages').append( '<span class="error">' +  data + '</span><br/>');
        });
        $('#m').val('');
        return false;
});

// 大眾訊息
socket.on('chat message', function(msg){
        $('#show_messages').append( '<span class="msg"><b>' + msg.nick_name + ': </b>' + msg.msg + '</span><span class="display_time">' + msg.display_time + '</span> <br/>');
});

// 私人訊息
socket.on('whisper', function(msg){
        $('#show_messages').append( '<span class="whisper"><b>' + msg.nick_name + ': </b>' + msg.msg + '</span><br/>');
});

// 私人訊息
socket.on('whisper_from_me', function(msg){
        $('#show_messages').append( '<span class="whisper_from_me"><b>' + msg.nick_name + ': </b>' + msg.msg + '</span><br/>');
});

// 系統訊息
socket.on('system', function(msg){
        $('#show_messages').append( '<span class="error"><b>' + msg.nick_name + ': </b>' + msg.msg + '</span><br/>');
});

