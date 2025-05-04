// client/src/App.js
import React, { useEffect, useState } from 'react';
import socket from './socket';

function App() {
  const [status, setStatus] = useState('サーバーに接続中...');
  const [room, setRoom] = useState(null);

  useEffect(() => {
    socket.on('connect', () => {
      console.log("success");
      setStatus('サーバー接続成功！相手を待っています...');
    });

    socket.on('waiting', (message) => {
      setStatus(message);
    });

    socket.on('startGame', (data) => {
      setStatus(`ゲーム開始！ルームID: ${data.room}`);
      setRoom(data.room);
    });

    return () => {
      socket.off('connect');
      socket.off('waiting');
      socket.off('startGame');
    };
  }, []);

  return (
    <div>
      <h1>電気イスゲーム</h1>
      <p>{status}</p>
      {room && <p>プレイ中のルーム: {room}</p>}
    </div>
  );
}

export default App;
