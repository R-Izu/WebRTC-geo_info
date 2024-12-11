$(function () {
    let localStream = null;
    let peer = null;
    let existingCall = null;

    // カメラ映像を取得
    navigator.mediaDevices.getUserMedia({ 
        video: {
            facingMode: { exact: "environment" }, 
            width: { ideal: 640 },
            height: { ideal: 480 }
        }, 
        audio: false })
        .then((stream) => {
            localStream = stream;
            $('#myStream').get(0).srcObject = stream;
        })
        .catch((error) => {
            console.error('mediaDevice.getUserMedia() error:', error);
        });

    // SkyWayの初期化
    peer = new Peer({
        key: '3d69d042-3fa9-4f57-beb2-55e70d8c005a',
        debug: 3,
    });

    peer.on('open', () => {
        $('#my-id').text(peer.id);
    });

    $('#make-call').submit((e) => {
        e.preventDefault();
        const roomName = $('#join-room').val();
        if (!roomName) return;

        const call = peer.joinRoom(roomName, { mode: 'sfu', stream: localStream });
        setupCallEventHandlers(call);
    });

    function setupCallEventHandlers(call) {
        if (existingCall) existingCall.close();
        existingCall = call;
        $('#room-id').text(call.name);

        call.on('stream', (stream) => {
            const videoElement = document.getElementById('myStream');
            videoElement.srcObject = stream;
            videoElement.play();
        });

        call.on('close', () => {
            existingCall = null;
        });
    }

    // フルスクリーンボタンの動作（映像のみ）
    $('#button1').on('click', function () {
        const videoElement = document.getElementById('myStream');
        if (videoElement.requestFullscreen) {
            videoElement.requestFullscreen();
        } else if (videoElement.webkitRequestFullscreen) {
            videoElement.webkitRequestFullscreen();
        } else if (videoElement.msRequestFullscreen) {
            videoElement.msRequestFullscreen();
        }
    });

    // WebSocketを使用して位置情報をサーバに送信
    const socket = new WebSocket('ws://localhost:8081');

    socket.onopen = () => {
        console.log('WebSocket接続が確立されました');
    };
    
    setInterval(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const now = new Date();
                const data = {
                    year: now.getFullYear(),
                    month: now.getMonth() + 1,
                    day: now.getDate(),
                    hour: now.getHours(),
                    minute: now.getMinutes(),
                    second: now.getSeconds(),
                    latitude: position.coords.latitude.toFixed(6),
                    longitude: position.coords.longitude.toFixed(6),
                };
                socket.send(JSON.stringify(data)); // WebSocketで直接送信
            });
        }
    }, 1000); // 毎フレーム送信 (60fps)
    
    socket.onclose = () => {
        console.log('WebSocket接続が閉じられました');
    };
});
