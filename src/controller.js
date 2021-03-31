const constants = require("./constants.js");

module.exports = class Controller {
  #users = new Map();
  #rooms = new Map();

  constructor({ socketServer }) {
    this.socketServer = socketServer;
  }

  #pickCollor() {
    return `#${(((1 << 24) * Math.random()) | 0).toString(16)}`;
  }

  onNewConnection(socket) {
    const { id } = socket;

    console.log("Usuário connecatado: ", id);
    const userData = { id, socket };
    this.#updateGlobalUserData(id, userData);
    this.socketServer.sendMessage(socket, "details", id);
  }

  async joinRoom(socketId) {
    return async (data) => {
      const userData = data;
      userData.color = this.#pickCollor();
      console.log(`${userData.userName} joined! ${[socketId]}`);
      const user = this.#updateGlobalUserData(socketId, userData);

      const { roomId } = userData;
      const users = await this.#joinUserOnRoom(roomId, user);

      // Remove o objeto socket deixando somente os valores do usuário
      const currentUsers = Array.from(users.values()).map(
        ({ id, userName }) => ({
          userName,
          id,
        })
      );

      // this.socketServer.sendMessage(
      //   user.socket,
      //   constants.event.UPDATE_USERS,
      //   currentUsers
      // );

      this.broadCast({
        socketId,
        roomId,
        message: {
          id: socketId,
          userName: userData.userName,
          color: userData.color,
        },
        event: constants.event.NEW_USER_CONNECTED,
        includeCurrentSocket: true,
      });
    };
  }

  broadCast({
    socketId,
    roomId,
    event,
    message,
    includeCurrentSocket = false,
  }) {
    const usersOnRoom = this.#rooms.get(roomId);
    if (!usersOnRoom) return;
    for (const [key, user] of usersOnRoom) {
      if (!includeCurrentSocket && key === socketId) continue;

      this.socketServer.sendMessage(user.socket, event, message);
    }
  }

  message(socketId) {
    return (data) => {
      const { userName, roomId, color } = this.#users.get(socketId);
      console.log(userName, "mesagee");
      this.broadCast({
        socketId,
        roomId,
        message: { userName, message: data, token: socketId, color },
        event: constants.event.MESSAGE,
        includeCurrentSocket: true,
      });
    };
  }

  async #joinUserOnRoom(roomId, user) {
    const usersOnRoom = this.#rooms.get(roomId) ?? new Map();
    usersOnRoom.set(user.id, user);
    this.#rooms.set(roomId, usersOnRoom);

    return usersOnRoom;
  }

  #logoutUser(id, roomId) {
    this.#users.delete(id);

    const usersInRoom = this.#rooms.get(roomId);
    if (usersInRoom) {
      usersInRoom.delete(id);
    }

    this.#rooms.set(roomId, usersInRoom);
  }

  onSocketClosed(id) {
    return (_) => {
      const { userName, roomId } = this.#users.get(id);
      console.log("disconnected");
      this.#logoutUser(id, roomId);
      this.broadCast({
        socketId: id,
        roomId,
        message: { id, userName },
        event: constants.event.DISCONNECT_USER,
      });
    };
  }

  #updateGlobalUserData(socketId, userData) {
    const users = this.#users;
    const user = users.get(socketId) || {};
    const updateUserData = {
      ...user,
      ...userData,
    };

    users.set(socketId, updateUserData);

    return users.get(socketId);
  }
};
