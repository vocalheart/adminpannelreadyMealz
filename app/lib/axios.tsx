





import axios from 'axios';

const instance = axios.create({
    // baseURL: "http://localhost:5000/api",
    baseURL: "https://api.a1meals.com/api",
    withCredentials: true,
});
export default instance;






