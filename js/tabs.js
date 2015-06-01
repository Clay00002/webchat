

function getParam(name)
{
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        result = regex.exec(location.search);
    return result === null ? "" : decodeURIComponent(result[1].replace(/\+/g, " "));
}

function check_chat_roon_status()
{
  	// 判斷是否開放聊天室
  	socket.emit('check_room_status', $.getParamJquery("room_id"), function(msg){
		if (msg)
		{
			$('#close_room').hide();
			$('.tabs').show();
			$('#message_box').show();
			$('#show_messages').show();
			$('#login_box').show();
			$('#send_message').show();

			socket.emit('check_login', $.getParamJquery("room_id"),  function(data){
				if (data)
				{


					$('#login_box').hide();
					$('#send_message').show();
				}
				else
				{
					$('#login_box').show();
					$('#send_message').hide();
				}
			})

			$('#users').show();
			socket.emit('link_socket');
		}
		else
		{
			$('#close_room').show();
			$('.abgne_tab').hide();
		}

	});
}


// 聊天室狀態

$( document ).ready(function() {

	$.getParamJquery = function(name, url)
	{
		if (!url)
	      	{
	      		url = window.location.href;
	      	}

      		var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(url);
      		if (!results)
      		{
          		return undefined;
      		}
      		return results[1] || undefined;
  	}

  	check_chat_roon_status();


});

$(window).load(function() {
      $("#show_messages").animate({ scrollTop: $(document).height() }, "slow");
      $('#show_messages').scrollTop(9999999);
});

window.setInterval(function() {
  var elem = document.getElementById('show_messages');
  elem.scrollTop = elem.scrollHeight;
}, 5000);

$(function(){
	// 預設顯示第一個 Tab

	var _showTab = 0;
	var $defaultLi = $('ul.tabs li').eq(_showTab).addClass('active');
	$($defaultLi.find('a').attr('href')).siblings().hide();

	// 當 li 頁籤被點擊時...
	// 若要改成滑鼠移到 li 頁籤就切換時, 把 click 改成 mouseover
	$('ul.tabs li:not(.out)').click(function() {
		// 找出 li 中的超連結 href(#id)
		var $this = $(this),
		    _clickTab = $this.find('a').attr('href');
		// 把目前點擊到的 li 頁籤加上 .active
		// 並把兄弟元素中有 .active 的都移除 class
		$this.addClass('active').siblings('.active').removeClass('active');
		// 淡入相對應的內容並隱藏兄弟元素
		$(_clickTab).stop(false, true).fadeIn().siblings().hide();

		// 顯示頁籤
		$('.tabs').show();
		return false;
	}).find('a').focus(function(){
		this.blur();
	});
});