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
/* `v2/search?fly_from=${data.fly_from}&fly_to=${data.fly_to}&date_from=${data.date_from}&date_to=${data.date_to}&nights_in_dst_from=${data.nights_in_dst_from}&nights_in_dst_to=${data.nights_in_dst_to}&max_fly_duration=${data.max_fly_duration}&adults=${data.adults}&children=${data.children}
&selected_cabins=${data.selected_cabins}&adult_hold_bag=${data.adult_hold_bag}&adult_hand_bag=${data.adult_hand_bag}&child_hold_bag=${data.child_hold_bag}&child_hand_bag=${data.child_hand_bag}&only_working_days=false&only_weekends=false
&partner_market=co&max_stopovers=2&max_sector_stopovers=2&vehicle_type=aircraft&limit=500&curr=COP&locale=es` */
/* fly_from
fly_to
date_from
date_to
nights_in_dst_from
nights_in_dst_to
max_fly_duration
adults
children
infants
selected_cabins
adult_hold_bag
adult_hand_bag
child_hold_bag
child_hand_bag */
exports.booking = async (req, res) => {
    const data = req.body; let child = ''; let infant = '';
    console.log('data: ', data);
    if (req.body.fly_from != '' && req.body.fly_from != undefined) {
        if(data.infants != '0'){ infant = `&infants=${data.infants}`; }
        if(data.children != '0'){ child = `&children=${data.children}&child_hold_bag=${data.child_hold_bag}&child_hand_bag=${data.child_hand_bag}`; }
        /* const search = `v2/search?fly_from=${data.fly_from}&fly_to=${data.fly_to}&date_from=${data.date_from}&date_to=${data.date_to}&nights_in_dst_from=${data.nights_in_dst_from}&nights_in_dst_to=${data.nights_in_dst_to}&max_fly_duration=${data.max_fly_duration}&adults=${data.adults}&children=${data.children}&selected_cabins=${data.selected_cabins}&adult_hold_bag=${data.adult_hold_bag}&adult_hand_bag=${data.adult_hand_bag}&child_hold_bag=${data.child_hold_bag}&child_hand_bag=${data.child_hand_bag}&only_working_days=false&only_weekends=false&partner_market=co&max_stopovers=2&max_sector_stopovers=2&vehicle_type=aircraft&limit=500&curr=COP&locale=es`; */
        //const search = `v2/search?fly_from=${data.fly_from}&fly_to=${data.fly_to}&date_from=${data.date_from}&date_to=${data.date_to}&nights_in_dst_from=${data.nights_in_dst_from}&nights_in_dst_to=${data.nights_in_dst_to}&max_fly_duration=${data.max_fly_duration}&adults=${data.adults}&adult_hold_bag=${data.adult_hold_bag}&adult_hand_bag=${data.adult_hand_bag}${child}${infant}&selected_cabins=${data.selected_cabins}&only_working_days=false&only_weekends=false&partner_market=co&max_stopovers=2&max_sector_stopovers=2&vehicle_type=aircraft&limit=500&curr=COP&locale=es`;
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
        /* console.log('console.log(,options);',options); */
        requesthttp(options, async (error, response, body) => {
            if (error) {
                /* console.log(error); */
                reject({ error: true, data: error });
            } else {
                /* console.log(response.body); */
                resolve(response.body);
            }
        })
    });
}