// tester.js
import { response } from "express";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); // your server URL

// Create or join room
socket.emit("join", {
    userName: "Amogh",
    password: "abcd@1234",
    roomId: "math102"
}, (msg, data) => {
    console.log("Callback received from server:");
    console.log("Message:", msg);       // "Created the room"
    console.log("Room ID:", data.roomId); // whatever roomId the server returned
});
