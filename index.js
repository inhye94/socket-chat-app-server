import express from "express";
import { Server } from "socket.io";
import http from "http";
import cors from "cors";

import { addUser, removeUser, getUser, getUsersInRoom } from "./users.js";

import router from "./router.js";

const PORT = process.env.PORT || 8080;
let serverTemp = 20;
let serverMute = false;
let serverStrength = 1;
let serverUsername = "";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("We have a connetion!!!");

  socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) return callback(error);

    // 나한테만 전송, welcome
    socket.emit("message", {
      user: "admin",
      text: `${user.name}, Welcome to the room ${user.room}`,
    });

    // 나 빼고 같은 룸의 모든 유저에게 전송, join
    socket.broadcast.to(user.room).emit("message", {
      user: "admin",
      text: `${user.name}, has joined!`,
    });

    // room에 조인
    socket.join(user.room);

    // 같은 룸의 모두에게 전송, roomData
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  // 클라이언트가 메세지를 보냄 (user -> all)
  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    // 같은 룸의 모두에게 전송
    io.to(user.room).emit("message", { user: user.name, text: message });
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  // NOTE: air 방에 진입
  socket.on("joinAir", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) {
      console.error(error);
      return;
    }

    // 룸에 들어가기
    socket.join(user.room);
    console.log(`${user.name} has joined! (room: ${user.room})`);

    // 초기값 emit
    socket.emit("initTemp", serverTemp);
    socket.emit("initMute", serverMute);
    socket.emit("initStrength", serverStrength);
    socket.emit("initUsername", serverUsername);

    callback();
  });

  // NOTE: plus temp
  socket.on("changeTemp", ({ temp }) => {
    let user = getUser(socket.id);

    console.log(`${user.name} change temp. (temp: ${temp})`);

    io.to(user.room).emit("broadcastTemp", { username: user.name, temp });

    serverTemp = temp;
    serverUsername = user.name;
  });

  // NOTE: toggle Mute
  socket.on("toggleMute", ({ mute }) => {
    let user = getUser(socket.id);

    console.log(`${user.name} change mute. (mute: ${mute})`);

    io.to(user.room).emit("broadcastMute", { username: user.name, mute });

    serverMute = mute;
    serverUsername = user.name;
  });

  // NOTE: changeStrength
  socket.on("changeStrength", ({ strength }) => {
    let user = getUser(socket.id);

    console.log(`${user.name} change strength. (strength: ${strength})`);

    io.to(user.room).emit("broadcastStrength", {
      username: user.name,
      strength,
    });

    serverStrength = strength;
    serverUsername = user.name;
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("message", {
        user: "admin",
        text: `${user.name} has left.`,
      });
    }
  });
});

app.use(router);

server.listen(PORT, () => {
  console.log(`Server has started on port ${PORT}`);
});
