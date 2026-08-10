import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

export const healthCheck = async () => {
  const response = await api.get("/health");
  return response.data;
};

export const uploadDocument = async (file: File) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post("/upload/", formData);

  return response.data;
};

export const chatWithDocument = async (question: string) => {
  const response = await api.post("/chat", {
    question,
  });

  return response.data;
};

export default api;