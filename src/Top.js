import socket from "./socket.js";
import {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';

function Top() {
    const navigate = useNavigate();
    useEffect(() => {
        socket.on('roomCreated', (roomId) => {
            console.log("roomcreated", roomId);
            navigate('/create-room', {state: roomId});
            console.log("部屋作成完了");
          })
    },[]);

    return (
        <>
        <h2>トップ画面</h2>
        <button onClick={() => socket.emit('createRoom')}>ルーム作成</button>
        <button onClick={() => navigate('/enter-room')}>ルームに入る</button>
        </>
    )
}

export default Top;