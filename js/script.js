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
    }

    return{
        init: function(userName, meetingid){
            init(userName, meetingid);
        }
    }
})()



