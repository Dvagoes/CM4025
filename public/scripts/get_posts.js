var posts

$(document).ready( function () {

    $.ajax({
        url: "/getPosts",
        type: "GET",
        success: function (response, textStatus, jqXHR) {

            eventInfo = JSON.parse(response);
        }
    })


})

function getPosts() {
    return posts;
}