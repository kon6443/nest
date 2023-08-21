
let socket = io.connect('/chat', {
    path: '/socket.io',
    transports: ['websocket'],
});

/*
socket.emit('');
socket.on('room-status', function (data) {
    console.log('available-rooms');
    const rooms = document.getElementById('rooms');
    for(let i=0;i<data['rooms'].length;i++) {
        let room = document.createElement('div');
        rooms.appendChild();
    }
    for(let i=0;i<data['activeUsers'].length;i++) {
        let user = document.createElement('div');
        user.innerHTML = `🟢 ${data['activeUsers'][i][1]}`;
        user.classList.add('chat-user');
        userList.appendChild(user);
    }
});
*/

const modalOpenButton = document.getElementById('room-create');
const modalCloseButton = document.getElementById('modalCloseButton');
const modal = document.getElementById('modalContainer');

modalOpenButton.addEventListener('click', () => {
    modal.classList.remove('hidden');
});

modalCloseButton.addEventListener('click', () => {
    modal.classList.add('hidden');
});

const modalContainer = document.getElementById('modalContainer');
const titleInput = document.getElementById('title-input');
const submitButton = document.querySelector('#modalContent button[type="submit"]');
// By hitting the enter key, it triggers the submitTitle() function below.
titleInput.addEventListener('keydown', (event) => {
    if(event.key === 'Enter' && !modalContainer.classList.contains('hidden')) {
        event.preventDefault(); // Prevents the default Enter key behavior
        submitButton.click(); // Trigger the submit button click
    }
});

function submitTitle() {
    const roomName = titleInput.value;
    if(!roomName) {
        return;
    }
    titleInput.value = '';
    // socket.emit('room-create-request', roomName);
    const url = `/chat/${roomName}`;
    modal.classList.add('hidden');
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }, 
    })
    .then(res => {
        if(res.ok) {
            return res.json();
        } else {
            return res.json().then(data => Promise.reject(data));
        }
    })
    .then(() => {
        socket.emit('room-status');
    })
    .catch(error => {
        alert(error.message);
    });
}

socket.emit('room-status');
socket.on('room-status', function (data) {
    const rooms = document.getElementById('rooms');
    rooms.innerHTML = '';
    for(let i=0;i<data.length;i++) {
        let room = document.createElement('div');
        room.innerHTML = `${data[i]}`;
        room.classList.add('room');
        room.addEventListener('click', () => {
            window.location.href = `/chat/${data[i]}`;
        });
        rooms.appendChild(room);
    }
});

socket.on('room-create-response', function(data) {
    if(data.status) {
        window.location.href = `/chat/${data.roomName}`;
    } else {
        window.alert(data);
    }
}); 
