import { constants } from "./constants.js";

export default class Controller {
  #users = new Map();
  #rooms = new Map();

  constructor({ socketServer }) {
    this.socketServer = socketServer;
  }

  onNewConnection(socket) {
    const { id } = socket;

    console.log("Usuário connecatado: ", id);
    const userData = { id, socket };
    this.#updateGlobalUserData(id, userData);

    // Qualquer evento recebido via socket bate aqui
    socket.on("data", this.#onSocketData(id));
    socket.on("end", this.#onSocketClosed(id));
    socket.on("error", this.#onSocketClosed(id));
  }

  async joinRoom(socketId, data) {
    const userData = data;
    console.log(`${userData.userName} joined! ${[socketId]}`);
    const user = this.#updateGlobalUserData(socketId, userData);

    const { roomId } = userData;
    const users = this.#joinUserOnRoom(roomId, user);

    // Remove o objeto socket deixando somente os valores do usuário
    const currentUsers = Array.from(users.values()).map(({ id, userName }) => ({
      userName,
      id,
    }));

    console.log(this.socketServer);
    this.socketServer.sendMessage(
      user.socket,
      constants.event.UPDATE_USERS,
      currentUsers
    );

    this.broadCast({
      socketId,
      roomId,
      message: { id: socketId, userName: userData.userName },
      event: constants.event.NEW_USER_CONNECTED,
    });
  }

  broadCast({
    socketId,
    roomId,
    event,
    message,
    includeCurrentSocket = false,
  }) {
    const usersOnRoom = this.#rooms.get(roomId);
    for (const [key, user] of usersOnRoom) {
      if (!includeCurrentSocket && key === socketId) continue;

      this.socketServer.sendMessage(user.socket, event, message);
    }
  }

  message(socketId, data) {
    const { userName, roomId } = this.#users.get(socketId);

    this.broadCast({
      socketId,
      roomId,
      message: { userName, message: data },
      event: constants.event.MESSAGE,
      includeCurrentSocket: true,
    });
  }

  #joinUserOnRoom(roomId, user) {
    const usersOnRoom = this.#rooms.get(roomId) ?? new Map();
    usersOnRoom.set(user.id, user);
    this.#rooms.set(roomId, usersOnRoom);

    return usersOnRoom;
  }

  #logoutUser(id, roomId) {
    this.#users.delete(id);

    const usersInRoom = this.#rooms.get(roomId);
    usersInRoom.delete(id);

    this.#rooms.set(roomId, usersInRoom);
  }

  #onSocketClosed(id) {
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

  #onSocketData(id) {
    return (data) => {
      try {
        const { event, message } = JSON.parse(data);
        this[event](id, message);
      } catch (err) {
        console.error(`'wrong event format`, data.toString());
      }
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
}
