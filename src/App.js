import React, { useState, useEffect } from 'react';
import socket from './socket';
import './App.css';

function App() {
  const [status, setStatus] = useState('サーバーに接続中...');
  const [connected, setConnected] = useState(false);
  const [seatChoice, setSeatChoice] = useState(null);        // 自分が座るイス
  const [electricTrap, setElectricTrap] = useState(null);    // 相手に電流を仕掛けるイス
  const [submitted, setSubmitted] = useState(false);         // 送信済みフラグ
  const [myPoints, setMyPoints] = useState(0);
  const [myShocks, setMyShocks] = useState(0);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('✅ サーバーと接続成功');
      setConnected(true);
      setStatus('相手を待っています...');
    });

    socket.on('bothReady', () => {
      setStatus('両者準備完了！イスを選んでください。');
    });

    socket.on('roundResult', (result) => {
      // 結果受信
      setStatus(result.message);
      setMyPoints(result.points);
      setMyShocks(result.shocks);
      setSubmitted(false);
      setSeatChoice(null);
      setElectricTrap(null);
    });

    socket.on('gameOver', (data) => {
      setStatus(`ゲーム終了！${data.winner === 'you' ? 'あなたの勝ち！' : '負けました...'}`);
      setSubmitted(true);
    });

    return () => {
      socket.off();
    };
  }, []);

  const handleSubmit = () => {
    console.log("handleSubmit");
    if (seatChoice && electricTrap) {
      console.log("handleSubmit2");
      socket.emit('submitChoice', {
        seat: seatChoice,
        trap: electricTrap,
      });
      console.log("handleSubmit3");
      setSubmitted(true);
      setStatus('相手の選択を待っています...');
    }
  };

  const renderSeats = () => {
    const seats = [];
    for (let i = 1; i <= 12; i++) {
      seats.push(
        <button
          key={i}
          disabled={submitted}
          onClick={() => setSeatChoice(i)}
          style={{
            margin: '4px',
            backgroundColor: seatChoice === i ? 'skyblue' : 'white',
          }}
        >
          {i}
        </button>
      );
    }
    return seats;
  };

  const renderTraps = () => {
    const traps = [];
    for (let i = 1; i <= 12; i++) {
      traps.push(
        <button
          key={i}
          disabled={submitted}
          onClick={() => setElectricTrap(i)}
          style={{
            margin: '4px',
            backgroundColor: electricTrap === i ? 'tomato' : 'white',
          }}
        >
          {i}
        </button>
      );
    }
    return traps;
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>⚡ 電気イスゲーム ⚡</h2>
      <p>{status}</p>

      <div style={{ marginBottom: '16px' }}>
        <h4>座りたいイスを選んでください:</h4>
        {renderSeats()}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h4>電流を仕掛けたいイスを選んでください:</h4>
        {renderTraps()}
      </div>

      <button onClick={handleSubmit} disabled={!seatChoice || !electricTrap || submitted}>
        選択を送信
      </button>

      <hr />
      <p>あなたのポイント: {myPoints}</p>
      <p>電流を受けた回数: {myShocks} / 3</p>
    </div>
  );
}

export default App;
