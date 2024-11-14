import axios, { AxiosInstance } from 'axios';

const coreApiUrl = process.env.CORE_API_URL || '';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: coreApiUrl,
  timeout: 50000,
});

export default axiosInstance;
