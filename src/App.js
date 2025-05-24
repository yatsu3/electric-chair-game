import React, { useState, useEffect, useRef } from 'react';
import socket from './socket.js';
import './App.css';
import { useNavigate } from 'react-router-dom';

function App() {
  const [status, setStatus] = useState('サーバーに接続中...');
  const [role, setRole] = useState(null);
  const roleRef = useRef(role); // 追加
  const [myPoints, setMyPoints] = useState(0);
  const [myShocks, setMyShocks] = useState(0);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [disabledSeats, setDisabledSeats] = useState([]);
  const [comment, setComment] = useState('');
  const [opponentComment, setOpponentComment] = useState('');
  const [isFinished, setIsFinished] = useState(false);

  const [screen, setScreen] = useState('home');
  const [roomId, setRoomId] = useState('');

  const navigate = useNavigate();


  useEffect(() => {
  roleRef.current = role;
}, [role]);


  useEffect(() => {
    socket.on('connect', () => {
      setStatus('相手を待っています...');
    });

    socket.onAny((event, ...args) => {
      console.log("📥 socket.onAny", event, args);
    });

    socket.on('roomCreated', (roomId) => {
      navigate('/create-room', {state: roomId});
      console.log("部屋作成完了");
      setRoomId(roomId);
    })

    socket.on('errorMessage', (msg) => {
      alert(msg);
      setScreen('home');
    });

    socket.on('yourTurnToTrap', () => {
      setRole('trapSetter');
      setStatus('⚡ 電流を仕掛けるイスを選んでください');
      setSelectedNumber(null);
    });

    socket.on('yourTurnToSit', (data) => {
      console.log("yourturntosit:", data);
      setRole('sitter');
      setStatus('💺 座るイスを選んでください');
      setSelectedNumber(null);
      setOpponentComment(data.comment || '');
    });

    socket.on('waitForOpponent', () => {
      setRole(null);
      setStatus('相手の行動を待っています...');
    });

    socket.on('status', (result) => {
      alert(result);
    })

    socket.on('roundResult', (result) => {
      console.log("result" , result);
      setStatus(result.message);
      setMyPoints(result.points);
      setMyShocks(result.shocks);
      setIsSubmitting(false);
      setSelectedNumber(null);
      setDisabledSeats(result.disabledSeats);
      // 得点が入った椅子を無効化（trapを回避＝成功時）
      if (
        roleRef.current === 'sitter' &&
        result.selectedSeat !== undefined &&
        !result.message.includes('失敗') &&
        !result.message.includes('電流を食らった')
      ) {
        console.log("disabled seat:", result.selectedSeat);
        setDisabledSeats(prev => [...new Set([...prev, result.selectedSeat])]);
      }
    });

    socket.on('gameOver', (data) => {
      setStatus(`ゲーム終了！${data.winner === 'you' ? 'あなたの勝ち！' : '負けました...'}`);
      setRole(null);
      setIsSubmitting(true);
      setIsFinished(true);
      
    });

    return () => socket.off();
  }, []);

  const handleSubmit = () => {
    if (!selectedNumber || isSubmitting) return; // 何も選んでいない場合

    if (role === 'trapSetter') {
      // 電気を仕掛ける側
      socket.emit('setTrap', { trapSeat: selectedNumber, comment });
      setStatus('相手が座るのを待っています...');
      setComment(''); // 送信後クリア
    } else if (role === 'sitter') {
      // 椅子に座る側
      socket.emit('setSeat', selectedNumber);
      setStatus('結果を待っています...');
    }
    setIsSubmitting(true);
  };

  const renderButtons = () => {
    const buttons = [];
    console.log("isSubmitting:", isSubmitting);
    console.log("disabledSeats:", disabledSeats);
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

  const retryGame = () => {
    console.log("clickretry");
    socket.emit('joinRoom', roomId);
  }

  return (
    <div style={{ padding: '20px' }}>

  <>
  <h2>⚡ 電気イスゲーム ⚡</h2>
      <p>{status}</p>

      {role && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <h4>{role === 'trapSetter' ? '電流を仕掛けるイスを選んでください:' : '座るイスを選んでください:'}</h4>
            {renderButtons()}
          </div>
          {role === 'trapSetter' ? <div><h4>相手に送るコメント</h4><textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="今回はかなり迷いました。" maxLength="30"></textarea></div> : ''}
          {role === 'sitter' && opponentComment && (
  <div style={{ marginBottom: '12px', padding: '8px', border: '1px solid gray', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
    相手からのコメント: 「{opponentComment}」
  </div>
)}
          <button onClick={handleSubmit} disabled={!selectedNumber || isSubmitting}>
            {role === 'trapSetter' ? '電流セット' : '座る！'}
          </button>
        </>
      )}

      <hr />
      <p>あなたのポイント: {myPoints}</p>
      <p>電流を受けた回数: {myShocks} / 3</p>
      </>
      {isFinished === true ? <><button onClick={retryGame}>もう一度遊ぶ</button><button>トップに戻る</button></>:<br></br>}
      
    </div>
  );
}

export default App;
