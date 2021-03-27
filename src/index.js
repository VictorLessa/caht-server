import SocketServer from "./socket.js";
import Events from "events";
import Controller from "./controller.js";
import { constants } from "./constants.js";

const port = process.env.PORT || 9898;
console.log(port);
const eventEmitter = new Events();
const socketServer = new SocketServer(port);
const server = await socketServer.initialize(eventEmitter);

console.log("Server is running in port " + server.address().port);

const controller = new Controller({ socketServer });
eventEmitter.on(
  constants.event.NEW_USER_CONNECTED,
  controller.onNewConnection.bind(controller)
);
