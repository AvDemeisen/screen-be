require('dotenv').config();
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);

const users = {};
const socketToRoom = {};

io.on('connection', (socket) => {
    const { id: userID } = socket;
    ioDebug('connection established!');

    socket.on('join-room', (roomID, userName = 'unknown user') => {
        const user = { userName, userID };
        socketDebug(`${userName} has joined ${roomID}, userID : ${userID}`);

        if (users[roomID]) users[roomID].push(user);
        else users[roomID] = [user];

        socketToRoom[userID] = roomID;
        const usersInThisRoom = users[roomID].filter((user) => user.userID !== userID);
        socket.emit('all-users', usersInThisRoom);
    });

    socket.on('sending-signal', (payload) => {
        const { userName, callerID, signal } = payload;
        io.to(payload.userToSignal).emit('user-joined', { signal, callerID, userName });
    });

    socket.on('returning-signal', (payload) => {
        const { signal } = payload;
        io.to(payload.callerID).emit('receiving-returned-signal', { signal, userID });
    });

    socket.on('disconnect', () => {
        const roomID = socketToRoom[userID];
        let room = users[roomID];
        if (room) {
            room = room.filter((user) => user.userID !== userID);
            users[roomID] = room;
        }
        socket.broadcast.emit('user-left', userID);
    });
});


server.listen(process.env.PORT || 4001, () => console.log('server is running on port 4001'));