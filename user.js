const users = [];

const addUser = ( id, name, roomId ) => {
  const existingUser = users.find(
    (user) => user.roomId === roomId && user.name === name
  );
  if (existingUser) {
    return false
  }
  const user = { id, name, roomId };
  users.push(user);
  return true
};

const removeUser = (id, roomId) => {
  const index = users.findIndex((user) => user.id === id && user.roomId == roomId);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

const getUser = (id) => users.find((user) => user.id === id);

const getUsersInRoom = (roomId) => {
  if (!roomId) return [];
  return users.filter((user) => user.roomId === roomId);
};


export { addUser, removeUser, getUser, getUsersInRoom };
