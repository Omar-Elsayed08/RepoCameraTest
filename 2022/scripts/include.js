// add functionality to the "includeHTML" attribute 
$(document).ready(function () {
    $("div[includeHTML]").each(function () {                
        $(this).load($(this).attr("includeHTML"));
    });
});