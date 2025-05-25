import { useLocation} from 'react-router-dom';
import {useEffect} from 'react';
import socket from "../socket.js";
import { useNavigate } from 'react-router-dom';

const CreateRoom = () => {
    const navigate = useNavigate();
    useEffect(() => {
        socket.on('gameReady', () => {
            navigate("/battle");
          })
    },[]);

    const location = useLocation();
    const roomId = location.state;
    console.log("[client]ルーム作成完了!");
    return (
        <>
            <h3>ルームID: {roomId}</h3>
            <p>友達にこのIDを教えてね！</p>
            <p>相手が参加するのを待っています...</p>
        </>
    )
}

export default CreateRoom;