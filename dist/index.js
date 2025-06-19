"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const http_1 = __importDefault(require("http"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const wss = new ws_1.WebSocketServer({ server });
const PORT = 8080;
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Store rooms and their connected sockets
const rooms = {};
// app.get('/',(req,res)=>{
//     res.send("Server is running");
// })
wss.on("connection", (ws) => {
    console.log("new client added");
    let currentRoom = "";
    ws.on("message", (data) => {
        const msg = JSON.parse(data.toString()); //JSON.parse converts string to json
        if (msg.type === "join-room") {
            currentRoom = msg.room;
            if (!rooms[currentRoom])
                rooms[currentRoom] = new Set();
            rooms[currentRoom].add(ws);
            broadcast(currentRoom, {
                type: 'user-count',
                count: rooms[currentRoom].size
            });
        }
        if (msg.type === "message") {
            broadcast(currentRoom, {
                type: 'message',
                text: msg.text,
                sender: msg.sender
            });
        }
    });
    wss.on('close', () => {
        if (rooms[currentRoom]) {
            rooms[currentRoom].delete(ws);
            if (rooms[currentRoom].size == 0)
                delete rooms[currentRoom];
            else {
                broadcast(currentRoom, {
                    type: 'user-count',
                    count: rooms[currentRoom].size
                });
            }
        }
    });
});
const broadcast = (room, msg) => {
    if (!rooms[room])
        return;
    rooms[room].forEach(client => {
        client.send(JSON.stringify(msg)); //stringfy is used for converting JSON->string
    });
};
app.get('/', (req, res) => {
    res.send("Websocket server running");
});
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
