import { customer_set_pin, get_booking_list, GITHUB_PANCHANG_BASE_URL, process_booking_data, process_booking_payment, temple_list, temple_services_list } from "./constantService";
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


export function getPanchangData(region, odiaType = null, year = null, month = null) {
    if (!year || !month) {
        const now = new Date();
        year = year || now.getFullYear();
        month = month || now.getMonth(); // 0-indexed
    }

    const monthName = new Date(year, month).toLocaleString('en-US', { month: 'long' }).toLowerCase();

    let url = `${GITHUB_PANCHANG_BASE_URL}/`;

    if (region.toLowerCase() === 'odisha') {
        odiaType = odiaType || 'jagannath_panji';
        url += `odisha/${odiaType}/${year}/${monthName}.json`;
    } else {
        url += `${region.toLowerCase()}/${year}/${monthName}.json`;
    }

    return fetch(url)
        .then(response => {
            if (response.ok) return response.json();
            throw new Error(`Failed to fetch Panchang data from ${url}`);
        })
        .then(data => ({ status: 200, data }))
        .catch(error => ({ status: 500, message: error.message }));
}

export async function getPaymentStatus(refCode) {
    console.log("Processing payment for:", refCode);

    const formData = new FormData();
    formData.append("ref_code", refCode);

    try {
        const response = await authAxiosPost(process_booking_payment, formData);
        console.log("Payment response:", response);
        return response;
    } catch (error) {
        console.error("Error in processPayment:", error);
        throw error;
    }
}