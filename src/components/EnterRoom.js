import socket from "../socket.js";
import {useRef} from 'react';
const EnterRoom = () => {
    const inputRef = useRef("");
    const roomId = "";

    const joinRoom = () => {
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