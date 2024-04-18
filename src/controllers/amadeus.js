/* const jwt = require('jsonwebtoken');
const sql = require("mssql");
const hash = require('../utils/hash'); */
const requesthttp = require('request');
const qs = require('qs');
const denarioController = require('../controllers/denario');
const authentication = { url: 'https://test.api.amadeus.com/', client_id: 'RBc7Aa3hYxfErGfTuLYqyoeNU1xqFW25', client_secret: 'N0hFslmwu3zpofYQ' }; //Pruebas
let token = '';

async function getToken() {
    return new Promise((resolve, reject) => { const body = qs.stringify({ 'grant_type': 'client_credentials', 'client_id': 'RBc7Aa3hYxfErGfTuLYqyoeNU1xqFW25', 'client_secret': 'N0hFslmwu3zpofYQ' }); const options = { method: 'post', url: authentication.url + 'v1/security/oauth2/token', headers: { 'Content-type': 'application/x-www-form-urlencoded' }, body: body, json: true }; requesthttp(options, async (error, response, body) => { if (error) { reject(false); } else { token = response.body.access_token; resolve(true); } }) });
}

exports.searchText = async (req, res) => {
    const data = req.body;
    if (data.search != '' && data.search != undefined) {
        let pathConsulta = `v1/reference-data/locations?keyword=${data.search}&page[limit]=${data.limit}&page[offset]=0&sort=analytics.travelers.score&view=LIGHT`;
        if (data.location_types) { for (dato of data.location_types) { pathConsulta += `&subType=${dato}`; } } else { pathConsulta += `&subType=airport`; }
        let resOk = await procesosAmadeus(pathConsulta, 'GET', {});
        if (resOk.errors) await getToken(); resOk = await procesosAmadeus(pathConsulta, 'GET', {});
        resOk.errors ? res.status(200).json({ error: true, data: resOk }) : res.status(200).json({ error: false, data: resOk });
    } else {
        res.status(400).json({ error: true, data: 'No se recibe texto' });
    }
}
exports.booking = async (req, res) => {
    console.log(req.body);
    /* v2/shopping/flight-offers?originLocationCode=PAR&destinationLocationCode=ICN&departureDate={{departureDate}}&returnDate={{returnDate}}&adults=2&max=5 */
    const arreglo = Object.entries(req.body); let pathConsulta = 'v2/shopping/flight-offers?nonStop=false&currencyCode=COP&';
    for (dato of arreglo) { pathConsulta += `&${dato[0]}=${dato[1]}`; }
    let resOk = await procesosAmadeus(pathConsulta, 'GET', {});
    if (resOk.errors) { await getToken(); resOk = await procesosAmadeus(pathConsulta, 'GET', {}); }
    res.status(200).json({ error: false, data: resOk });
}
async function procesosAmadeus(path, method, body) {
    return new Promise((resolve, reject) => {
        let options = {};
        if (method == 'GET') {
            options = { method: method, url: authentication.url + path, headers: { accept: 'application/json', 'content-type': 'application/json', 'Authorization': 'Bearer ' + token } };
        } else {
            options = { method: method, url: authentication.url + path, headers: { accept: 'application/json', 'content-type': 'application/json', 'Authorization': 'Bearer ' + token }, body: body, json: true };
        }
        requesthttp(options, async (error, response, body) => {
            if (error) { reject({ error: true, data: error }); } else { resolve(JSON.parse(response.body)); }
        })
    });
}
exports.saveBookingId = async (req, res) => {
    const request = new sql.Request(); const data = req.body;
    const textSql = `INSERT INTO BookingFlights (CreateDate, Document, EntireName, Email, Phone, Amount, Departure, Arrival, DepartureDate, ArrivalDate, RoundTrip) OUTPUT inserted.Id VALUES
    (GETDATE(), '${(data.Document).trim()}', '${(data.EntireName).trim()}', '${(data.Email).trim()}', '${(data.Phone).trim()}', ${data.Amount}, '${(data.Departure).trim()}', '${(data.Arrival).trim()}', '${(data.DepartureDate).trim()}', '${(data.ArrivalDate).trim()}', ${data.RoundTrip ? 1 : 0})`;
    request.query(textSql).then(result => {
        res.status(200).json({ error: false, data: result.recordset[0].Id });
    }).catch(err => {
        request.query(`DECLARE @maxVal INT; SELECT @maxVal=(SELECT COUNT(*) FROM BookingFlights); DBCC CHECKIDENT(BookingFlights, RESEED, @maxVal)`);
        res.status(400).json({ error: true, data: err });
    });
}
exports.getBookingId = async (req, res) => {
    const request = new sql.Request(); const data = req.body;
    const textSql = `SELECT * FROM BookingFlights WHERE Id=${data.Id}`;
    request.query(textSql).then(async result => {
        if (result.recordsets[0].length == 1) {
            const respDenario = await denarioController.creditLimit(result.recordsets[0][0].Document);
            res.status(200).json({ error: false, data: Object.assign(respDenario.body, result.recordsets[0][0]) });
        } else {
            res.status(200).json({ error: true, data: 'No se encuentra el registro' });
        }
        /* result.recordsets[0].length == 1 ? res.status(200).json({ error: false, data: result.recordsets[0][0] }) : res.status(200).json({ error: true, data: 'No se encuentra el registro' }); */
    }).catch(err => {
        console.log(err);
        res.status(400).json({ error: true, data: err });
    });
}
function esperar(data) { return new Promise(resolve => setTimeout(resolve, data)); }