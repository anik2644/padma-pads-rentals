import axios, { AxiosError } from "axios";
import { getFirebaseAuth } from "./firebase";

export const API_BASE = "http://213.136.73.10:8060";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 20_000,
});

async function getToken(force = false): Promise<string | null> {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken(force);
  } catch {
    return null;
  }
}

api.interceptors.request.use(async (cfg) => {
  const token = await getToken(false);
  if (token) {
    cfg.headers = cfg.headers ?? {};
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const originalConfig = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    if (error.response?.status === 401 && originalConfig && !originalConfig._retry) {
      originalConfig._retry = true;
      const fresh = await getToken(true);
      if (fresh) {
        originalConfig.headers = originalConfig.headers ?? {};
        (originalConfig.headers as Record<string, string>).Authorization = `Bearer ${fresh}`;
        return api.request(originalConfig);
      }
    }
    return Promise.reject(error);
  },
);
