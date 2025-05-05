import useLoadingStore from "@/store/loading.store";
import axios from "axios";

const axiosInstance = axios.create();

let activeRequests = 0;

axiosInstance.interceptors.request.use(
  (config) => {
    activeRequests++;
    useLoadingStore.getState().setIsLoading(true);
    return config;
  },
  (error) => {
    activeRequests = Math.max(activeRequests - 1, 0);
    if (activeRequests === 0) useLoadingStore.getState().setIsLoading(false);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    activeRequests = Math.max(activeRequests - 1, 0);
    if (activeRequests === 0) useLoadingStore.getState().setIsLoading(false);
    return response;
  },
  (error) => {
    activeRequests = Math.max(activeRequests - 1, 0);
    if (activeRequests === 0) useLoadingStore.getState().setIsLoading(false);
    return Promise.reject(error);
  }
);

export default axiosInstance;
