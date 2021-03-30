const http = require("http");
module.exports = class SocketServer {
  constructor(port) {
    this.port = port;
  }

  async sendMessage(socket, event, message) {
    console.log("send", event);
    socket.emit(event, message);
  }

  async initialize() {
    const server = http.createServer((req, res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Request-Method", "*");
      res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Hey there!");
    });

    return new Promise((resolve, reject) => {
      server.on("error", reject);
      server.listen(this.port, () => resolve(server));
    });
  }
};
