/* const jwt = require('jsonwebtoken');
const sql = require("mssql");
const hash = require('../utils/hash'); */
const requesthttp = require('request');
const authentication = { url: 'https://api.tequila.kiwi.com/', apikey: 'WD46QV90IhTg_UnVxzMcRuFO80K3W7wy' }; //Producción

exports.search_text = async (req, res) => {
    const data = req.body;
    if (data.search != '' && data.search != undefined) {
        let pathConsulta = `locations/query?term=${data.search}&limit=${data.limit}&locale=es-ES&active_online=true`;
        if (data.location_types) { for (dato of data.location_types) { pathConsulta += `&location_types=${dato}`; } } else { pathConsulta += `&location_types=airport`; }
        const resOk = await procesosTravel(pathConsulta, 'GET', {});
        res.status(200).json({ success: false, data: JSON.parse(resOk) });
    } else {
        res.status(400).json({ error: true, data: 'No se recibe texto' });
    }
}
exports.search_location = async (req, res) => {
    const data = req.body;
    if (data.lat != '' && data.lat != undefined) {
        const pathConsulta = `locations/radius?lat=${data.lat}&lon=${data.lon}&radius=250&locale=es-ES&active_only=true&location_types=city&location_types=airport`;
        const resOk = await procesosTravel(pathConsulta, 'GET', {});
        res.status(200).json({ success: false, data: JSON.parse(resOk) });
    } else {
        res.status(400).json({ error: true, data: 'No se recibe texto' });
    }
}
exports.booking = async (req, res) => {
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