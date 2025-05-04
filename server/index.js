const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const players = {};
let playerSockets = [];
let choices = {};

function resetGameState() {
  for (const id of playerSockets) {
    players[id] = {
      points: 0,
      shocks: 0,
    };
  }
  choices = {};
}

io.on('connection', (socket) => {
  console.log(`🎮 ユーザー接続: ${socket.id}`);
  playerSockets.push(socket.id);

  if (playerSockets.length === 2) {
    resetGameState();
    io.emit('bothReady');
  }

  socket.on('submitChoice', (data) => {
    choices[socket.id] = {
      seat: data.seat,
      trap: data.trap,
    };

    if (Object.keys(choices).length === 2) {
      const [id1, id2] = playerSockets;
      const p1 = choices[id1];
      const p2 = choices[id2];

      const results = {};

      // プレイヤー1の結果判定
      if (p1.seat === p2.trap) {
        players[id1].points = 0;
        players[id1].shocks += 1;
        results[id1] = {
          message: `💥 電流を食らった！スコアリセット。`,
        };
      } else {
        players[id1].points += p1.seat;
        results[id1] = {
          message: `😌 電流回避！${p1.seat}点獲得。`,
        };
      }

      // プレイヤー2の結果判定
      if (p2.seat === p1.trap) {
        players[id2].points = 0;
        players[id2].shocks += 1;
        results[id2] = {
          message: `💥 電流を食らった！スコアリセット。`,
        };
      } else {
        players[id2].points += p2.seat;
        results[id2] = {
          message: `😌 電流回避！${p2.seat}点獲得。`,
        };
      }

      // ゲーム終了判定
      for (const id of playerSockets) {
        if (players[id].points >= 40 || players[id].shocks >= 3) {
          const loser = id;
          const winner = playerSockets.find(pid => pid !== loser);
          io.to(winner).emit('gameOver', { winner: 'you' });
          io.to(loser).emit('gameOver', { winner: 'opponent' });
          choices = {};
          return;
        }
      }

      // 結果送信
      for (const id of playerSockets) {
        io.to(id).emit('roundResult', {
          message: results[id].message,
          points: players[id].points,
          shocks: players[id].shocks,
        });
      }

      // 次ラウンドへ
      choices = {};
    }
  });

  socket.on('disconnect', () => {
    console.log(`⛔ 切断: ${socket.id}`);
    playerSockets = playerSockets.filter(id => id !== socket.id);
    delete players[socket.id];
    delete choices[socket.id];
    io.emit('status', '相手が切断しました。リロードして再接続してください。');
  });
});

server.listen(3001, () => {
  console.log('🚀 サーバー起動 http://localhost:3001');
});
