var chrome_link = 'https://chrome.google.com/webstore/detail/ekcmgkhakdlcondlgmadpiogjnlggpne';
var firefox_link = 'https://addons.mozilla.org/en-US/firefox/addon/good-news-filter/';
var opera_link = 'https://addons.opera.com/en/extensions/details/good-news/?display=en';

var a = document.getElementById('aLink');
var userAgent = navigator.userAgent.toLowerCase();
if(userAgent.indexOf('chrome') > -1 && userAgent.indexOf('opr/') == -1)
{
	a.href = chrome_link;
}
else if(userAgent.indexOf('opr/') > -1)
{
	a.href = opera_link;
}
else
{
	a.href = firefox_link;
}