/* const jwt = require('jsonwebtoken');
const hash = require('../utils/hash'); */
const sql = require("mssql");
//const requesthttp = require('request');
//const authentication = { url: 'https://api.tequila.kiwi.com/', apikey: 'WD46QV90IhTg_UnVxzMcRuFO80K3W7wy' }; //Producción

exports.getBookingId = async (req, res) => {
    /* const request = new sql.Request(), data = req.body, textSql = `SELECT * FROM BookingReserves WHERE Id='${data.Id}' AND StatusReserve=1 AND (DATEADD(minute, -10, GETDATE()))<=CreateDate`; */
    const request = new sql.Request(), data = req.body, textSql = `SELECT * FROM BookingReserves WHERE Id='${data.Id}' AND StatusReserve=1`;
    request.query(textSql).then(async result => {
        result.recordsets[0].length == 1 ? res.status(200).json({ error: false, data: result.recordsets[0][0] }) : res.status(200).json({ error: true, data: 'Link no valido' });
    }).catch(err => {
        res.status(400).json({ error: true, data: err });
    });
}
exports.saveBookingId = async (req, res) => {
    const request = new sql.Request(), timestamp = Date.now(), data = req.body;
    const textSql = `INSERT INTO BookingReserves (Id, CreateDate, RoundTrip, DescriptionReserve, Document, EntireName, Email, Phone, Amount, StatusReserve, DataFlight) OUTPUT inserted.Id VALUES
    ('${(data.Document).trim()}-${timestamp}', GETDATE(), ${data.RoundTrip ? 1 : 0}, '${(data.DescriptionReserve).trim()}', '${(data.Document).trim()}', '${(data.EntireName).trim()}', '${(data.Email).trim()}', '${(data.Phone).trim()}', ${data.Amount}, 1, '${data.DataFlight}')`;
    request.query(textSql).then(result => {
        res.status(200).json({ error: false, data: result.recordset[0].Id });
    }).catch(err => {
        //request.query(`DECLARE @maxVal INT; SELECT @maxVal=(SELECT COUNT(*) FROM BookingFlights); DBCC CHECKIDENT(BookingFlights, RESEED, @maxVal)`);
        res.status(400).json({ error: true, data: err });
    });
}
exports.endingBookingId = async (req, res) => {
    const request = new sql.Request(), data = req.body;
    console.log('data: ', data);
    const textSql = `UPDATE BookingReserves SET UpdateDate=GETDATE(), StatusReserve=2, NumSolCredito=${data.credito.id}, NumSolDenarios=${data.puntos.id} WHERE Id='${data.data.Id}'`;
    console.log('textSql: ', textSql);
    request.query(textSql);
    res.end();
}
/* exports.searchText = async (req, res) => {
    const data = req.body;
    if (data.search != '' && data.search != undefined) {
        let pathConsulta = `locations/query?term=${data.search}&limit=${data.limit}&locale=es-ES&active_online=true`;
        if (data.location_types) { for (dato of data.location_types) { pathConsulta += `&location_types=${dato}`; } } else { pathConsulta += `&location_types=airport`; }
        const resOk = await procesosTravel(pathConsulta, 'GET', {});
        res.status(200).json({ error: false, data: JSON.parse(resOk) });
    } else {
        res.status(400).json({ error: true, data: 'No se recibe texto' });
    }
}
exports.searchLocation = async (req, res) => {
    const data = req.body;
    if (data.lat != '' && data.lat != undefined) {
        const pathConsulta = `locations/radius?lat=${data.lat}&lon=${data.lon}&radius=250&locale=es-ES&active_only=true&location_types=city&location_types=airport`;
        const resOk = await procesosTravel(pathConsulta, 'GET', {});
        res.status(200).json({ error: false, data: JSON.parse(resOk) });
    } else {
        res.status(400).json({ error: true, data: 'No se recibe texto' });
    }
}
exports.searchSubentity = async (req, res) => {
    const data = req.body;
    if (data.search != '' && data.search != undefined) {
        let pathConsulta = `locations/subentity?term=${data.search}&locale=es-ES&limit=${data.limit}&sort=name&active_only=true'`;
        if (data.location_types) { for (dato of data.location_types) { pathConsulta += `&location_types=${dato}`; } } else { pathConsulta += `&location_types=airport`; }
        const resOk = await procesosTravel(pathConsulta, 'GET', {});
        res.status(200).json({ error: false, data: JSON.parse(resOk) });
    } else {
        res.status(400).json({ error: true, data: 'No se recibe texto' });
    }
}
exports.searchTopdestinations = async (req, res) => {
    const data = req.body;
    if (data.search != '' && data.search != undefined) {
        const pathConsulta = `locations/topdestinations?term=${data.search}&locale=es-ES&limit=${data.limit}&sort=name&active_only=true&source_popularity=searches`;
        const resOk = await procesosTravel(pathConsulta, 'GET', {});
        res.status(200).json({ error: false, data: JSON.parse(resOk) });
    } else {
        res.status(400).json({ error: true, data: 'No se recibe texto' });
    }
}
exports.booking = async (req, res) => {
    const arreglo = Object.entries(req.body); let pathConsulta = 'v2/search?curr=COP&locale=co';
    for (dato of arreglo) { pathConsulta += `&${dato[0]}=${dato[1]}`; }
    const resOk = await procesosTravel(pathConsulta, 'GET', {});
    res.status(200).json({ error: false, data: JSON.parse(resOk) });
}
exports.bookingStep1 = async (req, res) => {
    const data = req.body;
    if (data.booking_token != '' && data.booking_token != undefined) {
        if (data.adults == undefined) { data.adults = 0; } if (data.children == undefined) { data.children = 0; } if (data.infants == undefined) { data.infants = 0; }
        const search = `v2/booking/check_flights?booking_token=${data.booking_token}&bnum=${data.bnum}&adults=${data.adults}&children=${data.children}&infants=${data.infants}&session_id=${data.session_id}&currency=COP&visitor_uniqid=${data.visitor_uniqid}`;
        let resOk = { data: 'vuelo no valido' }
        for (let i = 0; i < 6; i++) {
            const res = await procesosTravel(search, 'GET', {});
            if (JSON.parse(res).flights_checked == true && JSON.parse(res).price_change == false && JSON.parse(res).flights_invalid == false) { resOk = JSON.parse(res); i = 6; } else { await esperar(2000); }
        }
        if (resOk.flights_checked) {
            res.status(200).json({ error: false, data: resOk });
        } else {
            res.status(200).json({ error: false, data: 'vuelo no disponible' });
        }
    } else {
        res.status(400).json({ error: true, data: 'No se recibe texto' });
    }
}
async function validarBookingStep1(search, cont) {
    return new Promise(async (resolve, reject) => {
        cont++;
        const resOk = await procesosTravel(search, 'GET', {});
        console.log("El contador es: " + cont + ' + ' + JSON.parse(resOk).flights_checked + '-' + JSON.parse(resOk).price_change + '-' + JSON.parse(resOk).flights_invalid);
        if (JSON.parse(resOk).flights_checked == true && JSON.parse(resOk).price_change == false && JSON.parse(resOk).flights_invalid == false) {
            console.log('salir 1');
            resolve(JSON.parse(resOk));
        } else if (cont <= 5) {
            console.log(cont);
            console.log('nuevo intento');
            setTimeout(function () { validarBookingStep1(search, cont) }, 2000);
        } else {
            console.log('maximo intentos');
            resolve({ data: false });
        }
    });
}
exports.bookingStep2 = async (req, res) => {
    const data = req.body; let body = { health_declaration_checked: true, lang: "es", locale: "es-CO", payment_gateway: "payu" };
    Object.assign(body, data)
    if (data.visitor_uniqid != '' && data.visitor_uniqid != undefined) {
        if (data.adults == undefined) { data.adults = 0; } if (data.children == undefined) { data.children = 0; } if (data.infants == undefined) { data.infants = 0; }
        const search = `v2/booking/save_booking?visitor_uniqid=${data.visitor_uniqid}`;
        const resOk = await procesosTravel(search, 'POST', body);
        res.status(200).json({ error: false, data: resOk });
    } else {
        res.status(400).json({ error: true, data: 'No se recibe texto' });
    }
}
exports.bookingStep3 = async (req, res) => {
    const data = req.body;
    if (data.booking_id != '' && data.booking_id != undefined) {
        const search = `v2/booking/booking/confirm_payment`;
        const resOk = await procesosTravel(search, 'POST', body);
        res.status(200).json({ error: false, data: resOk });
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
function esperar(data) { return new Promise(resolve => setTimeout(resolve, data)); } */