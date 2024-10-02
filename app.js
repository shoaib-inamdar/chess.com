const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const { Chess } = require("chess.js");
const app = express();

const server = http.createServer(app);
const io = socketIo(server);

const chess = new Chess();

let players = {
    white: null,
    black: null
};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", function(req, res) {
    res.render("index", { title: "chess game" });
});

io.on("connection", function(socket) {
    console.log("Connected");
    if (!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit("playerRole", "b");
    } else {
        socket.emit("spectatorRole");
    }

    socket.on("disconnect", function() {
        if (socket.id === players.white) {
            players.white = null;
        } else if (socket.id === players.black) {
            players.black = null;
        }
    });

    socket.on("move", function(move) {
        try {
            if (chess.turn() === "w" && socket.id !== players.white) return;
            if (chess.turn() === "b" && socket.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                console.log("Invalid move");
                socket.emit("invalidMove", move);
            }
        } catch (err) {
            console.log(err);
            socket.emit("invalidMove", move);
        }
    });
});

server.listen(3000, () => {
    console.log("Server is running on port 3000");
});