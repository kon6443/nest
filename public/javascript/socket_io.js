
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

let socket = io.connect('/chat', {
    path: '/socket.io',
    transports: ['websocket'],
});

// receiving a message
socket.on('chat', function (data) {
    // Get the chat-content element
    const chatContentElement = document.getElementById('chat-content');

    let text = document.createElement('div');
    text.innerHTML = data.announcement ? data.announcement : `${data.id}: ${data.message}`;
    text.innerHTML = text.textContent.replace(/\n/g, '<br>');

    if(data.id===socket.id) {
        text.classList.add('chat-message', 'sent');
    } else {
        text.classList.add('chat-message', 'received');
    }

    // Append the row to the chat-content element
    chatContentElement.appendChild(text);
    document.getElementById('chat-type').value = '';
    chatContentElement.scrollTop = chatContentElement.scrollHeight;
});


function sendMsg() {
	const message = document.getElementById('chat-type').value;
    // socket.emit() method sends a message to the server.
    socket.emit('chat', message);
}

document.getElementById('chat-type').addEventListener('keypress', function(e) {
    const value = document.getElementById('chat-type').value;
    if(e.keyCode==13 && e.shiftKey) {
        document.getElementById('chat-type').innerHTML = value + '\n';
        return ;
    }
    if(e.keyCode==13 && value!=='') {
        sendMsg();
    }
})

