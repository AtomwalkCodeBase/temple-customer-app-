import { customer_set_pin, get_booking_list, process_booking_data, temple_list, temple_services_list } from "./constantService";
import { authAxios, authAxiosPost } from "./HttpMethod";



export function getTempleList() {
    return authAxios(temple_list)
}

export function getTempleServiceList() {
    return authAxios(temple_services_list)
}

export function processBooking(bookingData) {
    console.log(bookingData, "bookingData")
    const data = {}
    data["booking_data"] = bookingData
    return authAxiosPost(process_booking_data, data);
}

export function getBookingList(refcode) {
    let data = {
        'cust_ref_code': refcode
    }
    return authAxios(get_booking_list, data);
}

export function cancelBooking(cancelData) {
    const data = { booking_data: cancelData };
    return authAxiosPost(process_booking_data, data);
}

export function customerSetPin(u_id, o_pin, n_pin) {
    const data = {
        u_id,
        o_pin,
        n_pin,
    };
    return authAxiosPost(customer_set_pin, data);
}