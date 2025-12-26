import axios from "axios";
import { API_URL } from "../config/apiUrl.js";

const http = axios.create({ baseURL: API_URL });

http.interceptors.request.use((config) => {
    const token =
        typeof window !== "undefined"
            ? window.localStorage.getItem("auth_token")
            : null;
    if (token && !config.headers?.Authorization) {
        config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
        };
    }
    return config;
});

export default http;
