
let socket = io.connect('/chat', {
    path: '/socket.io',
    transports: ['websocket'],
});

socket.on('available-rooms', function (data) {
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

document.getElementById('room-create').addEventListener('click', () => {
    const roomTitle = ''
    socket.emit('room-create', roomName);
});


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
titleInput.addEventListener('keydown', (event) => {
    if(event.key === 'Enter' && !modalContainer.classList.contains('hidden')) {
        event.preventDefault(); // Prevents the default Enter key behavior
        submitButton.click(); // Trigger the submit button click
    }
});

function submitTitle() {
    const title = titleInput.value;
    console.log('title:', title);
    titleInput.value = '';
    modal.classList.add('hidden');
}