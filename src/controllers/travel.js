/* const jwt = require('jsonwebtoken');
const sql = require("mssql");
const hash = require('../utils/hash'); */
const requesthttp = require('request');
const authentication = { url: 'https://api.tequila.kiwi.com/', apikey: 'WD46QV90IhTg_UnVxzMcRuFO80K3W7wy' }; //Producción

exports.search_text = async (req, res) => {
    const data = req.body;
    if (data.search != '' && data.search != undefined) {
        const search = `locations/query?term=${data.search}&locale=es-ES&location_types=airport&limit=10&active_online=true`;
        const resOk = await procesosTravel(search, 'GET', {});
        res.status(200).json({ success: false, data: JSON.parse(resOk) });
    } else {
        res.status(400).json({ error: true, data: 'No se recibe texto' });
    }
}
exports.search_location = async (req, res) => {
    const data = req.body;
    if (data.lat != '' && data.lat != undefined) {
        const search = `locations/radius?lat=${data.lat}&lon=${data.lon}&radius=250&locale=es-ES&location_types=airport&limit=10&active_only=true`;
        const resOk = await procesosTravel(search, 'GET', {});
        res.status(200).json({ success: false, data: JSON.parse(resOk) });
    } else {
        res.status(400).json({ error: true, data: 'No se recibe texto' });
    }
}
/* {{kiwi}}locations/radius?lat=40.730610&lon=-73.935242&radius=250&locale=en-US&location_types=airport&limit=20&active_only=true */
exports.booking = async (req, res) => {
    /* const data = req.body; let child = ''; let infant = '';
    if (data.fly_from != '' && data.fly_from != undefined) {
        if (data.infants > 0 && data.infants < 10) { infant = `&infants=${data.infants}`; }
        if (data.children > 0 && data.children < 10) { child = `&children=${data.children}&child_hold_bag=${data.child_hold_bag}&child_hand_bag=${data.child_hand_bag}`; }
        const search = `v2/search?fly_from=${data.fly_from}&fly_to=${data.fly_to}&date_from=${data.date_from}&date_to=${data.date_to}&nights_in_dst_from=${data.nights_in_dst_from}&nights_in_dst_to=${data.nights_in_dst_to}&max_fly_duration=${data.max_fly_duration}&adults=${data.adults}&adult_hold_bag=${data.adult_hold_bag}&adult_hand_bag=${data.adult_hand_bag}${child}${infant}&selected_cabins=${data.selected_cabins}&only_working_days=false&only_weekends=false&partner_market=co&max_stopovers=2&max_sector_stopovers=2&vehicle_type=aircraft&limit=500&curr=COP&locale=es`;
        const resOk = await procesosTravel(search, 'GET', {});
        res.status(200).json({ success: false, data: JSON.parse(resOk) });
    } else {
        res.status(200).json({ success: true, data: 'No se recibe texto' });
    } */
    const arreglo = Object.entries(req.body); let pathConsulta = 'v2/search?curr=COP&locale=co';
    for (dato of arreglo) { pathConsulta += `&${dato[0]}=${dato[1]}`; }
    const resOk = await procesosTravel(pathConsulta, 'GET', {});
    res.status(200).json({ success: false, data: JSON.parse(resOk) });
}
exports.bookingStep1 = async (req, res) => {
    const data = req.body;
    if (data.booking_token != '' && data.booking_token != undefined) {
        if (data.adults == undefined) { data.adults = 0; } if (data.children == undefined) { data.children = 0; } if (data.infants == undefined) { data.infants = 0; }
        const search = `v2/booking/check_flights?booking_token=${data.booking_token}&bnum=${data.adults + data.children + data.infants}&adults=${data.adults}&children=${data.children}&infants=${data.infants}&session_id=${data.session_id}&currency=COP&visitor_uniqid=${data.visitor_uniqid}`;
        const resOk = await procesosTravel(search, 'GET', {});
        res.status(200).json({ success: false, data: JSON.parse(resOk) });
    } else {
        res.status(400).json({ error: true, data: 'No se recibe texto' });
    }
}
exports.bookingStep2 = async (req, res) => {
    const data = req.body; let body = { health_declaration_checked: true, lang: "es", locale: "es-CO", payment_gateway: "payu" }
    if (data.visitor_uniqid != '' && data.visitor_uniqid != undefined) {
        if (data.adults == undefined) { data.adults = 0; } if (data.children == undefined) { data.children = 0; } if (data.infants == undefined) { data.infants = 0; }
        const search = `v2/booking/save_booking?visitor_uniqid=${data.visitor_uniqid}`;
        const resOk = await procesosTravel(search, 'POST', {});
        res.status(200).json({ success: false, data: JSON.parse(resOk) });
    } else {
        res.status(400).json({ error: true, data: 'No se recibe texto' });
    }
}
async function procesosTravel(path, method, body) {
    return new Promise((resolve, reject) => {
        let options = {};
        if (method == 'GET') {
            options = { method: method, url: authentication.url + path, headers: { accept: 'application/json', 'content-type': 'application/json', 'apikey': authentication.apikey } };
        } else {
            options = { method: method, url: authentication.url + path, headers: { accept: 'application/json', 'content-type': 'application/json', 'apikey': authentication.apikey }, body: body, json: true };
        }
        requesthttp(options, async (error, response, body) => {
            if (error) {
                reject({ error: true, data: error });
            } else {
                resolve(response.body);
            }
        })
    });
}