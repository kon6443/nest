
// function signOut() {
//     $.ajax({
//         url: `/user/logout`,
//         method: "DELETE",
//         dataType: "json",
//         success: function(data, textStatus, jqXHR) {
//             location.reload();
//         },
//         error: function(res) {
//             alert('Invalid request.');
//         }
//     });
// }

function sendMsg() {
	const title = document.getElementById('title').value;
}


$("#chat-type").on("keyup", function () {
    if(window.event.keyCode==13 && $(this).val()!=""){
        sendMsg();
    }
});

