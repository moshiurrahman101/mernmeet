// toggle design script
$("#participant").click(function(){
    $(".sidebar").toggle()
});
$("#msg").click(function(){
    $(".sidebar").toggle()
});

// webRTC configaration
let videoprocess = (function(){

    // peers connection array
    let peers_connection_ids = []
    let peers_connection = []

    // media data audio/video
    let remote_video_strem = []
    let remote_audio_strem = []

    // mute / unmute variable declearation
    let local_div;
    let audio;
    let isAudioMute = true;
    let audio_sender = []
    let video_state = {
        none: 0, 
        camera: 1, 
        screenshare: 2,
    }
    let video_st = video_state.none
    let videoCameraTrack;
    let serverProcess;
    async function init(SDPfunction, myid){
        serverProcess = SDPfunction
        myconnectionid = myid
        eventProcess()
        local_div = document.getElementById("localVideo")
    }

    
    // Event processing function
    function eventProcess(){
        $("micOnOff").click(async function(){
            if(!audio){
                await loadAudio()
            }
            if(!audio){
                alert("Audio Permission has not granted")
            }
            if(isAudioMute){
                audio.enabled = true
                $("#micOnOff").html('<i class="fas fa-microphone"></i>')
                updateMediaSender(audio, audio_sender)
            }else{
                audio.enabled = false
                $("#micOnOff").html('<i class="fas fa-microphone-slash"></i>')
                removeMediaSender(audio_sender)
            }
            isAudioMute = !isAudioMute
        })

        $("#videoOnOff").click(async function(){
            console.log("click")
            if(video_st == video_state.camera){
                await deviceVideoProcess(video_state.none)
            }else{
                await deviceVideoProcess(video_state.camera)
            }
        })

        $("#shareOnOff").click(async function(){
            if(video_st == video_state.screenshare){
                await deviceVideoProcess(video_state.none)
            }else{
                await deviceVideoProcess(video_state.screenshare)
            }
        })
    }

    async function deviceVideoProcess(newVideoState){
        try{
            let vstream = null
            if (newVideoState == video_state.camera) {
                vstream = await navigator.mediaDevices.getUserMedia({
                    video:{
                        width:1920,
                        height:1080,
                    },
                    audio: false
                })
            }else if(newVideoState == video_state.screenshare){
                vstream = await navigator.mediaDevices.getDisplayMedia({
                    video:{
                        width:1920,
                        height:1080,
                    },
                    audio: false
                }) 
            }
            if (vstream && vstream.getVideoTracks().length > 0) {
                videoCameraTrack = vstream.getVideoTracks()[0]
                if (videoCameraTrack) {
                    local_div.srcObject = new MediaStream([videoCameraTrack])
                }
            }

        }catch(error){
            console.log(error)
            return;
        }
        video_st = newVideoState
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

    async function SDPprocess(message, from_id){
        message = JSON.parse(message)

        if (message.answer) {
            await peers_connection(from_id).setRemoteDescription(new RTCSessionDescription(message.answer))
        }else if(message.offer){
            if(!peers_connection(from_id)){
                await setConnection(from_id)
            }
            await peers_connection(from_id).setRemoteDescription(new RTCSessionDescription(message.offer))
            let answer = await peers_connection(from_id).createAnswer()
            await peers_connection(from_id).setLocalDescription(answer)
            serverProcess(JSON.stringify({answer: answer}), from_id)
        }else if (message.icecadidate){
            if(!peers_connection(from_id)){
                await setConnection(from_id)
            }
            
            try {
                await peers_connection(from_id).addIceCandidate(message.icecadidate)
            } catch (error) {
                console.log(error)
            }
        }
    }
    
    return{
        setNewVideoConnection: async function(connectid){
           await setConnection(connectid)
        },
        init: async function(SDPfunction, myid){
            await init(SDPfunction, myid)
        },
        proccessClient: async function(data, connid){
            await SDPprocess(data, connid)
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

        // Get SDPFuction data from server
        socket.on("SDPfunction", async function(data){
            await videoprocess.proccessClient(data.message, data.from_connectid)
        })
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



