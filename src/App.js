import React, { useState, useEffect, useRef } from 'react';
import socket from './socket';
import './App.css';

function App() {
  const [status, setStatus] = useState('サーバーに接続中...');
  const [role, setRole] = useState(null);
  const roleRef = useRef(role); // 追加
  const [myPoints, setMyPoints] = useState(0);
  const [myShocks, setMyShocks] = useState(0);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [disabledSeats, setDisabledSeats] = useState([]);

  useEffect(() => {
  roleRef.current = role;
}, [role]);


  useEffect(() => {
    socket.on('connect', () => {
      setStatus('相手を待っています...');
    });

    socket.on('yourTurnToTrap', () => {
      setRole('trapSetter');
      setStatus('⚡ 電流を仕掛けるイスを選んでください');
      setSelectedNumber(null);
    });

    socket.on('yourTurnToSit', () => {
      setRole('sitter');
      setStatus('💺 座るイスを選んでください');
      setSelectedNumber(null);
    });

    socket.on('waitForOpponent', () => {
      setRole(null);
      setStatus('相手の行動を待っています...');
    });

    socket.on('roundResult', (result) => {
      console.log("result" , result);
      setStatus(result.message);
      setMyPoints(result.points);
      setMyShocks(result.shocks);
      setIsSubmitting(false);
      setSelectedNumber(null);
      // 得点が入った椅子を無効化（trapを回避＝成功時）
      if (
        roleRef.current === 'sitter' &&
        result.selectedSeat !== undefined &&
        !result.message.includes('失敗')
      ) {
        console.log("disabled seat:", result.selectedSeat);
        setDisabledSeats(prev => [...new Set([...prev, result.selectedSeat])]);
      }
    });

    socket.on('gameOver', (data) => {
      setStatus(`ゲーム終了！${data.winner === 'you' ? 'あなたの勝ち！' : '負けました...'}`);
      setRole(null);
      setIsSubmitting(true);
    });

    return () => socket.off();
  }, []);

  const handleSubmit = () => {
    if (!selectedNumber || isSubmitting) return;
    if (role === 'trapSetter') {
      socket.emit('setTrap', selectedNumber);
      setStatus('相手が座るのを待っています...');
    } else if (role === 'sitter') {
      socket.emit('setSeat', selectedNumber);
      setStatus('結果を待っています...');
    }
    setIsSubmitting(true);
  };

  const renderButtons = () => {
    const buttons = [];
    for (let i = 1; i <= 12; i++) {
      buttons.push(
        <button
          key={i}
          disabled={isSubmitting || (disabledSeats.includes(i))}
          onClick={() => setSelectedNumber(i)}
          style={{
            margin: '4px',
            backgroundColor: selectedNumber === i ? (role === 'trapSetter' ? 'yellow' : 'skyblue') : 'white',
          }}
        >
          {i}
        </button>
      );
    }
    return buttons;
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>⚡ 電気イスゲーム ⚡</h2>
      <p>{status}</p>

      {role && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <h4>{role === 'trapSetter' ? '電流を仕掛けるイスを選んでください:' : '座るイスを選んでください:'}</h4>
            {renderButtons()}
          </div>
          <button onClick={handleSubmit} disabled={!selectedNumber || isSubmitting}>
            {role === 'trapSetter' ? '電流セット' : '座る！'}
          </button>
        </>
      )}

      <hr />
      <p>あなたのポイント: {myPoints}</p>
      <p>電流を受けた回数: {myShocks} / 3</p>
    </div>
  );
}

export default App;
