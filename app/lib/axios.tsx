

import axios from 'axios';

const instance = axios.create({
    baseURL: "https://api.readymealz.in/api",
    withCredentials: true,
});

export default instance;


