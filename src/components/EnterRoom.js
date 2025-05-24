import socket from "../socket.js";
import {useRef, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
const EnterRoom = () => {
    const navigate = useNavigate();
    useEffect(() => {
        socket.on('gameReady',async () => {
            navigate("/battle");
          })
    });
    const inputRef = useRef("");
    let roomId = "";

    const joinRoom = () => {
        console.log("[client]--joinRoom--");
        roomId = inputRef.current.value;
        if (roomId) {
            socket.emit('joinRoom', roomId);
        } else {
            alert('ルームIDを入力してください');
        }
    }

    return (
        <>
            <h3>ルームに参加</h3>
            <input ref={inputRef} placeholder="ルームID" />
            <button onClick={joinRoom}>参加</button>
        </>
    )
}

export default EnterRoom;