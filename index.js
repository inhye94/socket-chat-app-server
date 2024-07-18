import express from "express";
import { Server } from "socket.io";
import http from "http";
import cors from "cors";

import { addUser, removeUser, getUser, getUsersInRoom } from "./users.js";

import router from "./router.js";

const PORT = process.env.PORT || 8080;
let temp = 10;

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

    // 클라이언트의 유저에게 메시지 (admin -> user)
    socket.emit("message", {
      user: "admin",
      text: `${user.name}, Welcome to the room ${user.room}`,
    });
    // 같은 룸에 있는 클라이언트의 모든 유저에게 메세지, admin 제외 (admin -> room)
    socket.broadcast.to(user.room).emit("message", {
      user: "admin",
      text: `${user.name}, has joined!`,
    });

    socket.join(user.room);

    // room에 있는 유저 보여주기
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  // 클라이언트가 메세지를 보냄 (user -> all)
  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    // 클라이언트 모든 유저에게 메시지
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
      console.log(error);
      return;
    }

    // 룸에 들어가기
    socket.join(user.room);

    console.log(`${user.name} has joined! (room: ${user.room})`);

    // initTemp 알려주기
    io.to(user.room).emit("initTemp", temp);

    callback();
  });

  // NOTE: plus temp
  socket.on("plusTemp", ({ name, room }) => {
    let user = getUser(socket.id);

    if (!user) {
      const { user: userData } = addUser({ id: socket.id, name, room });

      user = { ...userData };

      // 룸에 들어가기
      socket.join(user.room);

      console.log(`${user.name} has joined! (room: ${user.room})`);
    }

    if (temp < 30) {
      temp += 1;
      console.log(`${user.name} change temp. (temp: ${temp})`);
    }

    io.to(user.room).emit("tempChange", { username: user.name, temp });
  });

  // NOTE: minus temp
  socket.on("minusTemp", ({ name, room }) => {
    let user = getUser(socket.id);

    if (!user) {
      const { user: userData } = addUser({ id: socket.id, name, room });

      user = { ...userData };

      // 룸에 들어가기
      socket.join(user.room);

      console.log(`${user.name} has joined! (room: ${user.room})`);
    }

    if (temp > 0) {
      temp -= 1;
      console.log(`${user.name} change temp. (temp: ${temp})`);
    }

    io.to(user.room).emit("tempChange", { username: user.name, temp });
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
