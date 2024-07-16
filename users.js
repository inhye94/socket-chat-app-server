// NOTE: helper function
// manage user (in/out/action ...)

const users = [];

const addUser = ({ id, name, room }) => {
  // NOTE: name 정책
  // inhye PArk = inhyepark

  name = name.trim().toLowerCase();
  room = room.trim().toLowerCase();

  const existingUser = users.find(
    (user) => user.room === room && user.name === name
  );

  // NOTE: 필요한 정보가 빠진 경우 (return error)
  if (!name || !room) return { error: "Username and room are required." };

  // NOTE: 이미 유저가 있는 경우 (return error)
  if (existingUser) {
    return { error: "Username is taken" };
  }

  // NOTE: 새로운 유저인 경우 (return user)
  const user = { id, name, room };
  users.push(user);

  return { user };
};

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

const getUser = (id) => {
  return users.find((user) => user.id === id);
};

const getUsersInRoom = (room) => users.filter((user) => user.room === room);

export { addUser, removeUser, getUser, getUsersInRoom };
