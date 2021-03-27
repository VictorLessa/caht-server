import SocketServer from "./socket.js";
import Events from "events";
import Controller from "./controller.js";
import { constants } from "./constants.js";

async function testeServer() {
  const opt = {
    port: 8989,
    host: "localhost",
    headers: {
      Connection: "Upgrade",
      Upgrade: "webSocket",
    },
  };
  const http = await import("http");

  const server = http.request(opt);

  server.end();

  server.on("upgrade", (req, socket) => {
    // socket.on("data", (data) => {
    //   console.log(data.toString());
    // });
    // setInterval(() => {
    //   socket.write("Hello");
    // }, 500);
  });
}

const port = process.env.PORT || 8989;

const eventEmitter = new Events();
const socketServer = new SocketServer(port);
const server = await socketServer.initialize(eventEmitter);

console.log("Server is running in port " + server.address().port);

const controller = new Controller({ socketServer });
eventEmitter.on(
  constants.event.NEW_USER_CONNECTED,
  controller.onNewConnection.bind(controller)
);

//   console.log(socket.id);
//   socket.on("data", (data) => {
//     console.log(data.toString());
//     socket.write("World");
//   });
// });

testeServer();
