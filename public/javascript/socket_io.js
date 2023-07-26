
let socket = io.connect('/chat', {
    path: '/socket.io',
    transports: ['websocket'],
});

// receiving a message
socket.on('chat', function (data) {
    // Get the chat-content element
    const chatContentElement = document.getElementById('chat-content');

    let text = document.createElement('div');
    text.innerHTML = data.announcement ? data.announcement : `${data.userId}: ${data.message}`;
    text.innerHTML = text.textContent.replace(/\n/g, '<br>');

    const sentBy = data.id===socket.id ? 'mySelf' : 'other';
    text.classList.add('chat-message', sentBy);

    // Append the row to the chat-content element
    chatContentElement.appendChild(text);
    document.getElementById('chat-type').value = '';
    chatContentElement.scrollTop = chatContentElement.scrollHeight;
});

function sendMsg(userId) {
	const message = document.getElementById('chat-type').value;
    const payload = {
        userId,
        message
    };
    // socket.emit() method sends a message to the server.
    socket.emit('chat', payload);
}

document.getElementById('chat-type').addEventListener('keypress', function(e) {
    const value = document.getElementById('chat-type').value;
    if(e.keyCode==13 && e.shiftKey) {
        document.getElementById('chat-type').innerHTML = value + '\n';
        return ;
    }
    if(e.keyCode==13 && value!=='') {
        document.getElementById('chat-button').click();
    }
})

