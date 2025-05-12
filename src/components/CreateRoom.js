import { useLocation} from 'react-router-dom';

const CreateRoom = () => {
    const location = useLocation();
    console.log('location', location);
    const roomId = location.state;
    console.log("aaa", roomId);
    return (
        <>
            <h3>ルームID: {roomId}</h3>
            <p>友達にこのIDを教えてね！</p>
            <p>相手が参加するのを待っています...</p>
        </>
    )
}

export default CreateRoom;