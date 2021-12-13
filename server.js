const express = require("express")
const path = require("path")
const app = express()

let server = app.listen(3000, function(){
    console.log("server running on http://localhost:3000")
})

const io = require("socket.io")(server)

// user connection stor in this array
let usersConnection = []

io.on("connection", (socket)=>{
    socket.on("userconnect",(clientData)=>{
        usersConnection.push({
            connectionid: socket.id,
            username: clientData.username,
            meetingid: clientData.meetingid
        })
    })
    console.log(usersConnection)
})

app.use(express.static(path.join(__dirname,"")))