// services/authService.js

export async function customerLogin(mobile_number, pin) {
    try {
        const response = await fetch(
            'https://temple.atomwalk.com/customer/api/customer_pin_login/',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile_number, pin }),
            }
        );

        if (!response.ok) {
            throw new Error('Invalid credentials');
        }

        return await response.json(); // Contains token, cust_ref_code, customer_id
    } catch (error) {
        throw error;
    }
}

export async function customerForgotPin(mobile_number) {
    try {
        const response = await fetch(
            'https://temple.atomwalk.com/customer/api/customer_forget_pin/',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile_number }),
            }
        );

        if (!response.ok) {
            throw new Error('Failed to reset PIN');
        }

        return await response.json(); // Contains message and e_pin
    } catch (error) {
        throw error;
    }
}

export async function customerRegister(name, mobile_number, email_id, alternate_contact_number) {
    try {
        const response = await fetch(
            'https://temple.atomwalk.com/customer/api/customer_registration/',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    mobile_number,
                    email_id,
                    alternate_contact_number,
                }),
            }
        );

        if (!response.ok) {
            throw new Error('Registration failed');
        }

        return await response.json(); // Contains pin, ref_code
    } catch (error) {
        throw error;
    }
}

export async function customerSetPin(u_id, o_pin, n_pin) {
    try {
        const response = await fetch(
            "https://temple.atomwalk.com/customer/api/customer_set_pin/",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ u_id, o_pin, n_pin }),
            }
        );

        const text = await response.text();
        console.log("API Response:", text);

        try {
            return JSON.parse(text);
        } catch {
            return { status: "error", message: text }; // fallback if not JSON
        }
    } catch (error) {
        throw error;
    }
}

