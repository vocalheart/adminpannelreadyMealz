
import axios from 'axios';

const instance = axios.create({
    baseURL: "https://readymealzbackend.onrender.com/api",
    withCredentials: true,
});

export default instance;