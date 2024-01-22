/* const jwt = require('jsonwebtoken');
const sql = require("mssql");
const hash = require('../utils/hash'); */
const requesthttp = require('request');
const authentication = { url: 'https://api.tequila.kiwi.com/', apikey: 'WD46QV90IhTg_UnVxzMcRuFO80K3W7wy' }; //Producción

exports.search = async (req, res) => {
    if (req.body.search != '' && req.body.search != undefined) {
        const search = `locations/query?term=${req.body.search}&locale=es-CO&location_types=airport&limit=10&active_online=true`;
        const resOk = await procesosTravelDenario(search, 'GET', {});
        res.status(200).json({ success: false, data: JSON.parse(resOk) });
    } else {
        res.status(200).json({ success: true, data: 'No se recibe texto' });
    }
}
exports.booking = async (req, res) => {
    const data = req.body; let child = ''; let infant = '';
    if (data.fly_from != '' && data.fly_from != undefined) {
        if (data.infants > 0 && data.infants < 10) { infant = `&infants=${data.infants}`; }
        if (data.children > 0 && data.children < 10) { child = `&children=${data.children}&child_hold_bag=${data.child_hold_bag}&child_hand_bag=${data.child_hand_bag}`; }
        const search = `v2/search?fly_from=${data.fly_from}&fly_to=${data.fly_to}&date_from=${data.date_from}&date_to=${data.date_to}&nights_in_dst_from=${data.nights_in_dst_from}&nights_in_dst_to=${data.nights_in_dst_to}&max_fly_duration=${data.max_fly_duration}&adults=${data.adults}&adult_hold_bag=${data.adult_hold_bag}&adult_hand_bag=${data.adult_hand_bag}${child}${infant}&selected_cabins=${data.selected_cabins}&only_working_days=false&only_weekends=false&partner_market=co&max_stopovers=2&max_sector_stopovers=2&vehicle_type=aircraft&limit=500&curr=COP&locale=es`;
        const resOk = await procesosTravelDenario(search, 'GET', {});
        res.status(200).json({ success: false, data: JSON.parse(resOk) });
    } else {
        res.status(200).json({ success: true, data: 'No se recibe texto' });
    }
}
/* `v2/booking/check_flights?
booking_token=${data}
&bnum=${data}&adults=${data}&children=${data}&infants=${data}&session_id=7f541be8-4d08-89ee-8ead-e0a95f63cfeb
&currency=COP&visitor_uniqid=049b01af4d674d6ab9bafb35_0|049b01af4d674d6ab9bafb35_1|049b01af4d674d6ab9bafb35_2|049b01af4d674d6ab9bafb35_3` */
exports.bookingStep1 = async (req, res) => {
    const data = req.body;
    if (data.booking_token != '' && data.booking_token != undefined) {
        if (data.adults == undefined) { data.adults = 0; } if (data.children == undefined) { data.children = 0; } if (data.infants == undefined) { data.infants = 0; }
        const search = `v2/booking/check_flights?booking_token=${data.booking_token}&bnum=${data.adults + data.children + data.infants}&adults=${data.adults}&children=${data.children}&infants=${data.infants}&session_id=${data.session_id}&currency=COP&visitor_uniqid=${data.visitor_uniqid}`;
        const resOk = await procesosTravelDenario(search, 'GET', {});
        res.status(200).json({ success: false, data: JSON.parse(resOk) });
    } else {
        res.status(200).json({ success: true, data: 'No se recibe texto' });
    }
}
async function procesosTravelDenario(path, method, body) {
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