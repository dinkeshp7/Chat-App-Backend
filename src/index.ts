import express from "express";
import {WebSocketServer} from "ws";
import http from "http";
import cors from "cors";

const app = express();
const server=http.createServer(app);
const wss= new WebSocketServer({server});
const PORT = 8080;

app.use(express.json());
app.use(cors());

// Store rooms and their connected sockets
const rooms: Record<string, Set<any>> = {};

// app.get('/',(req,res)=>{
//     res.send("Server is running");
// })


wss.on("connection",(ws)=>{
    console.log("new client added");
    let currentRoom : string ="";

    ws.on("message",(data)=>{
        const msg = JSON.parse(data.toString());
        if(msg.type === "join-room"){
            currentRoom = msg.room;
            if(!rooms[currentRoom]) rooms[currentRoom] = new Set();
            rooms[currentRoom].add(ws);

            broadcast(currentRoom,{
                type:'user-count',
                count:rooms[currentRoom].size
            })
        }

        if(msg.type === "message"){
            broadcast(currentRoom,{
                type: 'message',
                text: msg.text,
                sender: msg.sender
            })
        }
    })

    wss.on('close',()=>{
        if(rooms[currentRoom]){
            rooms[currentRoom].delete(ws);
            if(rooms[currentRoom].size == 0) delete rooms[currentRoom];
            else{
                broadcast(currentRoom,{
                    type:'user-count',
                    count:rooms[currentRoom].size
                })
            }
        }
    })
})


const broadcast=(room:string,msg:any)=>{
    if(!rooms[room]) return;
    rooms[room].forEach(client=>{
        client.send(JSON.stringify(msg)); //stringfy
    })
}

app.get('/',(req,res)=>{
    res.send("Websocket server running")
})

server.listen(PORT,()=>{
    console.log(`Server running on http://localhost:${PORT}`);
})