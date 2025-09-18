import axios from "axios";
// import { endpoint } from "../constants";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { localhost } from "./constantService";


export const authAxios = async (url, data) => {
    let token = await AsyncStorage.getItem('user');
    return axios.create({
        baseURL: localhost,
        params: data,
        headers: {
            Authorization: `Token ${token}`
        }
    }).get(url)
};

export const authAxiosPost = async (url, data) => {
    let token = await AsyncStorage.getItem('user');
    console.log(url, data, "url")
    return axios.create({
        baseURL: localhost,
        headers: {
            Authorization: `Token ${token}`
        }
    }).post(url, data)
};



export const authAxiosFilePost = async (url, data) => {
    let token = await AsyncStorage.getItem('user');
    if (!(data instanceof FormData)) {
        console.error('Data is not FormData!');
        return;
    }


    return axios.create({
        baseURL: localhost,
        headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'multipart/form-data',
        }
    }).post(url, data)

};


export const publicAxiosRequest = axios.create({
    baseURL: localhost,
});


export default {
    get: axios.get,
    post: axios.post,
    put: axios.put,
    delete: axios.delete,
};
