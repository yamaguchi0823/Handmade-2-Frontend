import axios from "axios";

const api = axios.create({
  baseURL: "/api", // Ecripseで起動しているSpring ※vite.config.jsの proxy と対応
  withCredentials: true,
});

export default api;

export function fetchItems() {
  return api.get("/items");
}

export function createItem(payload) {
  // payload: { name, description }
  return api.post("/items", payload);
}
