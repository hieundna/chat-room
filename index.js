var express = require("express");
const http = require("http");
var app = express();
const server = http.createServer(app);

const socketIo = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

let publicRoom = "S3";
let usersInRoom = [];
let usersTyping = [];

socketIo.on("connection", (socket) => {
  console.log("New client connected " + socket.id);
  socket.emit("getId", socket.id);

  socket.on("joinPublicRoom", (data) => {
    console.log("new user joined: ", data.name);
    socket.join(publicRoom);
    socket.to(publicRoom).emit("newMember", { ...data });
    if (!usersInRoom.some((u) => u.id === socket.id)) {
      usersInRoom.push(data);
    }
    socket.emit("totalUser", usersInRoom.length)
    socket.to(publicRoom).emit("totalUser", usersInRoom.length)
    console.log(usersInRoom);
  });

  socket.on("sendMessage", function (data) {
    socket.to(publicRoom).emit("receive.publicRoom", {
      id: data.id,
      name: data.name,
      content: data.content,
      // room: data.room,
    });
  });

  socket.on("typing", (data) => {
    const typing = data.typing;
    const userIdx = usersTyping.findIndex((user) => user.id === data.id);
    if (typing) {
      if (userIdx < 0) {
        usersTyping.push(data);
      }
    } else {
      if (userIdx >= 0) {
        usersTyping.splice(userIdx, 1);
      }
    }
    socket.to(publicRoom).emit("typingList", usersTyping);
  });

  socket.on("disconnect", () => {
    const user = usersInRoom.findIndex((u) => u.id === socket.id);
    const typingIdx = usersTyping.findIndex((user) => user.id === socket.id);
    if (user >= 0) {
      usersInRoom.splice(user, 1);
    }
    if (typingIdx >= 0) {
      usersTyping.splice(typingIdx, 1);
    }
    socket.to(publicRoom).emit('typingList', usersTyping);
    socket.to(publicRoom).emit('totalUser', usersInRoom.length)
    console.log("Client disconnected");
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
