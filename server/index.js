
import express from 'express';
import http from 'http';
import {Server} from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

import { v4 as uuidv4 } from 'uuid';

const players = {};
let playerSockets = [];
let currentTurn = 0; // 0 または 1 を示す
const disabledSeats = [];

// import {useNavigate} from 'react-router-dom';


function resetGameState() {
  players[playerSockets[0]] = { points: 0, shocks: 0 };
  players[playerSockets[1]] = { points: 0, shocks: 0 };
  currentTurn = 0;
}

const rooms = {};
let roomId = "";


io.on('connection', (socket) => {
  console.log(`🎮 ユーザー接続: ${socket.id}`);
  playerSockets.push(socket.id);

  // ルーム作成時の処理
  socket.on('createRoom', () => {
    console.log("[server]--createRoom--");
    roomId = uuidv4().slice(0,10); // ランダムなルームIDを作成
    console.log("roomId:", roomId);
    rooms[roomId] = [socket.id]; // 作成したルームにソケットIDを登録
    console.log("rooms:", rooms);
    console.log("rooms[roomId]", rooms[roomId]);
    players[socket.id] = {points: 0, shocks: 0, roomId}; // プレイヤー情報を登録
    console.log("現在のプレイヤー:", players);
    socket.join(roomId); // 作成したルームIDに参加
    socket.emit('roomCreated', roomId); // イベント発火
  });

  socket.onAny((event, ...args) => {
    console.log("📤 サーバー受信:", event, args);
  });

  // ルームに入る時の処理
  socket.on('joinRoom', (roomId) => {
    console.log("[server]--joinRoom--:", roomId);
    const room = rooms[roomId];　// ルームに入ってるソケット情報
    console.log("現在のルーム:", room);
    room.push(socket.id); // ソケットIDをルームに追加
    console.log('ルームに２つのsocketIDが入っている', room);
    players[socket.id] = { points: 0, shocks: 0, roomId}; // プレイヤー情報を登録

    socket.join(roomId); // ルームに参加

    // 両者に通知
    if(checkConnection) {
      // alert("両者揃いました!");
      io.to(roomId).emit('gameReady');
      resetGameState();
      startTurn(roomId);
    } else {
      alert("部屋が誤っているか相手が退出しました。再度やり直してください。");
    }
  })


  // 同じコネクションに2人揃ったらゲームスタート
  // if (playerSockets.length === 2) {
  //   resetGameState();
  //   startTurn();
  // }

  socket.on('setTrap', ({trapSeat, comment}) => {
    console.log("[server]--setTrap--");
    console.log("trapSeat:", trapSeat);
    console.log("comment:", comment);
    console.log("currentTurn:", currentTurn);
    const trapSetter = playerSockets[currentTurn];
    const sitter = playerSockets[1 - currentTurn];
    players[trapSetter].trap = trapSeat;
    console.log("setTrap:", comment);

    io.to(sitter).emit('yourTurnToSit', {comment});
  });

  socket.on('setSeat', (seatNumber) => {
    console.log("[server]--setSeat--");
    console.log("座った椅子:", seatNumber)
    const trapSetter = playerSockets[currentTurn];
    const sitter = playerSockets[1 - currentTurn];
    console.log("trapsetter:", trapSetter);
    console.log("sitter:", sitter);
    const trap = players[trapSetter].trap;

    let messageToSitter;
    if (seatNumber === trap) {
      players[sitter].points = 0;
      players[sitter].shocks += 1;
      messageToSitter = `💥 電流を食らった！スコアリセット。`;
    } else {
      players[sitter].points += seatNumber;
      messageToSitter = `😌 電流回避！${seatNumber}点獲得。`;
    }

    // 無効化する座席をサーバー側で管理
    if (seatNumber !== trap) {
      disabledSeats.push(seatNumber);
    }

    io.to(sitter).emit('roundResult', {
      message: messageToSitter,
      points: players[sitter].points,
      shocks: players[sitter].shocks,
      selectedSeat: seatNumber,
      disabledSeats,
    });

    io.to(trapSetter).emit('roundResult', {
      message: `相手は ${seatNumber} に座りました。${seatNumber === trap ? '成功！電流を食らわせた！' : '失敗！外されました。'}`,
      points: players[trapSetter].points,
      shocks: players[trapSetter].shocks,
      selectedSeat: seatNumber,
      disabledSeats,
    });

    // ゲーム終了判定
    for (const id of playerSockets) {
      if (players[id].points >= 40) {
        io.to(id).emit('gameOver', { winner: 'you' });
        const opponent = playerSockets.find(pid => pid !== id);
        io.to(opponent).emit('gameOver', { winner: 'opponent' });
        return;
      }
      if (players[id].shocks >= 3) {
        io.to(id).emit('gameOver', { winner: 'opponent' });
        const opponent = playerSockets.find(pid => pid !== id);
        io.to(opponent).emit('gameOver', { winner: 'you' });
        return;
      }
    }

    setTimeout(() => {
      console.log("currentTurnBefore:", currentTurn);
      // currentTurn = 1 - currentTurn;
      currentTurn = currentTurn === 1 ? 0 : 1;

      console.log("currentTurnAfter:", currentTurn);
      startTurn(roomId);
    }, 3000); // 3秒結果を見せてから次のターン


  });

  socket.on('disconnect', () => {
    console.log(`⛔ 切断: ${socket.id}`);
    console.log("testBefore", rooms[roomId]);
    playerSockets = playerSockets.filter(id => id !== socket.id);
    delete players[socket.id];
    console.log("testAfter", rooms[roomId]);

    rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
    // 部屋が空になったら削除
    if (rooms[roomId].length === 0) {
      delete rooms[roomId];
      console.log(`🗑️ ルーム削除: ${roomId}`);
      console.log("現在の部屋:", rooms);
    }
    io.emit('status', '相手が切断しました。リロードして再接続してください。');
  });
});

function checkConnection() {
  if (playerSockets.length === 2 && room.length === 2) return true;
  return false;
}

function startTurn(roomId) {
  console.log("startTurn", roomId);
  // const trapSetter = playerSockets[currentTurn];
  // const sitter = playerSockets[1 - currentTurn];
  // io.to(trapSetter).emit('yourTurnToTrap');
  // io.to(sitter).emit('waitForOpponent');

  const [player1, player2] = rooms[roomId];
  // const currentTurn = Math.floor(Math.random() * 2);
  console.log("currentTurn:", currentTurn);
  const trapSetter = currentTurn === 0 ? player1 : player2;
  const sitter = currentTurn === 0 ? player2 : player1;

  console.log("trap", trapSetter);
  console.log("sitter", sitter);

  players[trapSetter].turn = 'trapSetter';
  players[sitter].turn = 'sitter';

  io.to(trapSetter).emit('yourTurnToTrap');
  io.to(sitter).emit('waitForOpponent');
}

server.listen(3001, () => {
  console.log('🚀 サーバー起動 http://localhost:3001');
});
