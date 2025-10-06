import AsyncStorage from '@react-native-async-storage/async-storage';

const getDbName = async () => {
    let dbName = await AsyncStorage.getItem('dbName');
    return dbName;
}
export const localhost = "https://agamandira.com";
export const endpoint = `${localhost}/temple/api`;
export const customerEndpoint = `${localhost}/customer/api`

export const temple_list = `${endpoint}/get_temple_list/`;

export const temple_services_list = `${endpoint}/get_temple_services_list/`;

export const process_booking_data = `${customerEndpoint}/process_booking_data/`;

export const get_booking_list = `${customerEndpoint}/get_booking_list/`;

export const customer_set_pin = `${customerEndpoint}/customer_reset_pin/`;

export const process_booking_payment = `${customerEndpoint}/process_booking_payment/`;

// Github API
export const GITHUB_PANCHANG_BASE_URL = 'https://raw.githubusercontent.com/AtomwalkCodeBase/Blogs/main/hindu-panchang-data';