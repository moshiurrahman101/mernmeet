// toggle design script
$("#participant").click(function(){
    $(".sidebar").toggle()
});
$("#msg").click(function(){
    $(".sidebar").toggle()
});



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



