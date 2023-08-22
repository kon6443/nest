
let socket = io.connect('/chat', {
    path: '/socket.io',
    transports: ['websocket'],
});

// socket.emit('user-status', 'asdf');
socket.emit('user-status');

socket.on('user-status-response', function (data) {
    console.log('data:', data);
});


function createChatMessage(data, chatPosition) {
    // Creating a name div
    const userNameDiv = document.createElement('div');
    userNameDiv.innerHTML = data.userId;
    userNameDiv.classList.add('chat-name');

    // Creating a message div.
    const messageDiv = document.createElement('div');
    messageDiv.innerHTML = data.message;
    messageDiv.innerHTML = messageDiv.textContent.replace(/\n/g, '<br>');
    messageDiv.classList.add('chat-message');

    // Creating a parent div and appending above two child divs.
    const chatDiv = document.createElement('div');
    chatDiv.appendChild(userNameDiv);
    chatDiv.appendChild(messageDiv);
    chatDiv.classList.add('chatElement', chatPosition);

    const chatContentElement = document.getElementById('chat-content');
    chatContentElement.appendChild(chatDiv);
    chatContentElement.scrollTop = chatContentElement.scrollHeight;
    return chatDiv;
}

// Receiving 'chat' event.
socket.on('chat', function (data) {
    const chatPosition = data.id===socket.id ? 'right' : 'left';
    createChatMessage(data, chatPosition);
});

// Receiving 'chat-bot' event.
socket.on('chat-bot', function (data) {
    createChatMessage(data, 'left');
});

// Receiving 'user-status' event.
socket.on('user-status', function (data) {
    const userList = document.getElementById('chat-user-list');
    userList.innerHTML = '';
    for(let i=0;i<data['activeUsers'].length;i++) {
        let user = document.createElement('div');
        user.innerHTML = `🟢 ${data['activeUsers'][i][1]}`;
        user.classList.add('chat-user');
        userList.appendChild(user);
    }
});

function sendMsg(userId, roomName) {
	const message = document.getElementById('chat-type').value;
    const payload = {
        userId,
        message,
        roomName
    };
    // socket.emit() method sends a message to the server.
    socket.emit('chat', payload);
    // socket.to(roomName).emit('chat', payload);
}

document.getElementById('chat-type').addEventListener('keypress', function(e) {
    const value = document.getElementById('chat-type').value;
    if(e.keyCode==13 && e.shiftKey) {
        document.getElementById('chat-type').innerHTML = value + '\n';
        return ;
    }
    if(e.keyCode==13 && value!=='') {
        document.getElementById('chat-button').click();
        document.getElementById('chat-type').value = '';
        e.preventDefault(); // Prevents default Enter key behavior
    }
})

