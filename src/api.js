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

export function createVariant(payload) {
  return api.post("/variants", payload);
}

export function updateVariant(variantId, payload) {
  return api.put(`/variants/${variantId}`, payload);
}

export function fetchStockHistory(variantId, limit = 50) {
  return api.get(`/variants/${variantId}/stock-movements`, {
    params: { limit },
  });
}
export function adjustStock(variantId, payload) {
  // payload:{ newStock, note }
  return api.post(`/variants/${variantId}/stock-movements/adjust`, payload);
}

export function uploadVariantImage(variantId, file) {
  const fd = new FormData();
  fd.append("file", file);

  return api.post(`/variants/${variantId}/image`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export function deleteVariantImage(variantId) {
  return api.delete(`/variants/${variantId}/image`);
}

export function createSale(payload) {
  return api.post("/sales", payload);
}

export function fetchSales(limit = 50) {
  return api.get("/sales", { params: { limit } });
}

export function fetchSaleDetail(saleId) {
  return api.get(`/sales/${saleId}`);
}

export function fetchChannels() {
  return api.get("/channels");
}
