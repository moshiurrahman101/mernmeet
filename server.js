const express = require("express")
const path = require("path")
const app = express()

let server = app.listen(3000, function(){
    console.log("server running on http://localhost:3000")
})

const io = require("socket.io")(server)

// user connection store in this array
let usersConnection = []

io.on("connection", (socket)=>{
    socket.on("userconnect",(clientData)=>{
        let myid = usersConnection.filter((user)=> user.meetingid == clientData.meetingid);
        usersConnection.push({
            connectionid: socket.id,
            username: clientData.username,
            meetingid: clientData.meetingid
        })
        myid.forEach((item)=>{
            socket.to(item.connectionid).emit("myinformation",{
                myusername: item.username,
                connectid: item.connectionid
            })
        })
    })
})

app.use(express.static(path.join(__dirname,"")))