$(document).ready(function ()
{
	// Get the header
	$.get("https://raw.githubusercontent.com/jenra-uwu/jenra-uwu.github.io/master/header.html",
		function (data, textStatus, jqXHR)
		{
			$("header").html(data);
			$("header").show();
		}
	);
});
