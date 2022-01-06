// toggle design script
$("#participant").click(function(){
    $(".sidebar").toggle()
});
$("#msg").click(function(){
    $(".sidebar").toggle()
});

// webRTC configaration
let videoprocess = (function(){

    let peers_connection_ids = []
    let peers_connection = []
    let remote_video_strem = []
    let remote_audio_strem = []

    let serverProcess;
    async function init(SDPfunction, myid){
        serverProcess = SDPfunction
        myconnectionid = myid
    }

    let configaration = {
        connectionServer:[
            {
                urls: "stun:stun.l.google.com:19302"
            },
            {
                urls: "stun:stun1.l.google.com:19302"
            }
        ]
    }
    async function setConnection(connectid){
        let connection = new RTCPeerConnection(configaration);
        
        connection.onnegotiationneeded = async function(event){
            await setOffer(connectid)
        }

        connection.onicecandidate = function(event){
            if (event.candidate) {
                serverProcess(JSON.stringify({iceCadidate: event.candidate}), connectid)
            }
        }

        /// Tracking user media
        connection.ontrack = function(event){

            if(!remote_video_strem[connectid]){
                remote_video_strem[connectid] = new MediaStream()
            }

            if(!remote_audio_strem[connectid]){
                remote_audio_strem[connectid] = new MediaStream()
            }

            if (event.track.kind == "video") {
                remote_video_strem[connectid]
                .getVideoTracks()
                .forEach((t) => remote_video_strem[connectid].removeTrack(t))

                remote_video_strem[connectid].addTrack(event.track)
                let remoteVideo = document.querySelector(`#video_${connectid}`)
                remoteVideo.srcObject = null
                remoteVideo.srcObject = remote_video_strem[connectid]
                remoteVideo.load()
            }else if (event.track.kind == "audio"){
                remote_audio_strem[connectid]
                .getVideoTracks() // error able code remider
                .forEach((t) => remote_audio_strem[connectid].removeTrack(t))

                remote_audio_strem[connectid].addTrack(event.track)
                let remoteAudio = document.querySelector(`#audio_${connectid}`)
                remoteAudio.srcObject = null
                remoteAudio.srcObject = remote_audio_strem[connectid]
                remoteAudio.load()
            }

        }

        peers_connection_ids[connectid] = connectid
        peers_connection[connectid] = connection

        return connection
    }

    async function setOffer(connectionID){
        let connection = peers_connection[connectid]
        let offer = await connection.createOffer()
        await connection.setLocalDescription(offer)
        serverProcess(JSON.stringify({offer: connection.localDescription}), connectionID)
    }
    
    return{
        setNewVideoConnection: async function(connectid){
           await setConnection(connectid)
        },
        init: async function(SDPfunction, myid){
            await init(SDPfunction, myid)
        }

    }
})()

/*
    App configuration
*/

let myvdoapp = (function(){

    function init(userName, meetingid){
        connectionFromClient(userName, meetingid)
    }

    // socket connection
    let socket = null
    function connectionFromClient(userName, meetingid){
        // socket set
        socket = io.connect()

        // SDPfunction 
        function SDPfunction(data, connectid){
            socket.emit("SDPfunction",{
                message: data,
                connectid: connectid
            })
        }
        socket.on("connect",()=>{
            if (socket.connected) {

                if (userName != "" && meetingid != null) {
                    // send data client to backend
                    socket.emit("userconnect",{
                        username: userName,
                        meetingid: meetingid
                    })
                }else{
                    alert("username/meeting id are missing!")
                    let baseURL = window.location.origin
                    window.location.replace(baseURL+"/join.html")
                }
            }
        })

        socket.on("myinformation", (dataserver) => {
            adduservideo(dataserver.myusername, dataserver.connectid);
            videoprocess.setNewVideoConnection(dataserver.connectid)
        });

        function adduservideo(myusername, connectid) {
            let newuservideo = $("#otherself").clone();
            newuservideo = newuservideo.attr("id", connectid).addClass("other")
            newuservideo.find("h1").text(myusername)
            newuservideo.find("video").attr("id", `video_${connectid}`)
            newuservideo.find("audio").attr("id", `audio_${connectid}`)
            newuservideo.show()
            $(".video").append(newuservideo)
        }
    }

    return{
        init: function(userName, meetingid){
            init(userName, meetingid);
        }
    }
})()



