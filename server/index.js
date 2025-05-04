const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // 開発中は全許可でOK、本番では制限する
  },
});

let waitingPlayer = null;

io.on('connection', (socket) => {
  console.log(`🟢 新しいプレイヤー接続: ${socket.id}`);

  if (waitingPlayer) {
    const room = `room-${waitingPlayer.id}-${socket.id}`;
    socket.join(room);
    waitingPlayer.join(room);

    io.to(room).emit('startGame', {
      room,
      player1: waitingPlayer.id,
      player2: socket.id,
    });

    waitingPlayer = null;
  } else {
    waitingPlayer = socket;
    socket.emit('waiting', '相手を待っています...');
  }

  socket.on('playerMove', ({ room, move }) => {
    // move = { trapChair: 5, sitChair: 8 }
    socket.to(room).emit('opponentMove', move);
  });

  socket.on('disconnect', () => {
    console.log(`🔴 切断: ${socket.id}`);
    if (waitingPlayer && waitingPlayer.id === socket.id) {
      waitingPlayer = null;
    }
    // TODO: 部屋にいた相手プレイヤーへの通知も実装できる
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 サーバー起動: http://localhost:${PORT}`);
});
