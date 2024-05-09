/* const jwt = require('jsonwebtoken');
const hash = require('../utils/hash'); */
//const sql = require("mssql");
const requesthttp = require('request');
const qs = require('qs');
const xml2js = require('xml2js');
const authentication = { url: 'https://test.api.amadeus.com/', client_id: 'RBc7Aa3hYxfErGfTuLYqyoeNU1xqFW25', client_secret: 'N0hFslmwu3zpofYQ' }; //Pruebas
let token = '';
const builder = new xml2js.Builder();
const headerAmadeus = require('../controllers/headerAmadeus');

exports.testXML = async (req, res) => {
    const response = await procesosAmadeusXML('https://www.dataaccess.com/webservicesserver/NumberConversion.wso', 'POST', req.body);
    res.status(200).json({ error: false, data: response });
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
async function procesosAmadeusXML(path, method, body) {
    return new Promise(async (resolve, reject) => {
        let options = {};
        const newXML = await json2xml(body)
        if (method == 'GET') {
            options = { method: method, url: path, headers: { 'content-type': 'application/soap+xml; charset=utf-8' } };
        } else {
            options = { method: method, url: path, headers: { 'content-type': 'application/soap+xml; charset=utf-8' }, body: newXML };
        }
        requesthttp(options, async (error, response, body) => {
            if (error) { reject({ error: true, data: error }); } else { const newJSON = await xml2json(response.body); resolve(newJSON); }
        })
    });
}
/* function esperar(data) { return new Promise(resolve => setTimeout(resolve, data)); } */
exports.xml2jsonReq = async (req, res) => {
    const resOk = await xml2json(req.body.xml);
    res.status(200).json({ error: false, data: resOk });
}
exports.json2xmlReq = async (req, res) => {
    const resOk = await json2xml(req.body);
    res.status(200).json({ error: false, data: resOk });
}
async function getToken() {
    return new Promise((resolve, reject) => { const body = qs.stringify({ 'grant_type': 'client_credentials', 'client_id': 'RBc7Aa3hYxfErGfTuLYqyoeNU1xqFW25', 'client_secret': 'N0hFslmwu3zpofYQ' }); const options = { method: 'post', url: authentication.url + 'v1/security/oauth2/token', headers: { 'Content-type': 'application/x-www-form-urlencoded' }, body: body, json: true }; requesthttp(options, async (error, response, body) => { if (error) { reject(false); } else { token = response.body.access_token; resolve(true); } }) });
}
async function xml2json(xml) {
    return new Promise((resolve, reject) => {
        const parser = new xml2js.Parser(); parser.parseString(xml, function (err, result) { resolve(result); });
    });
}
async function json2xml(json) {
    return new Promise((resolve, reject) => {
        resolve(builder.buildObject(json));
    });
}
exports.header = async (req, res) => {
    console.log('llega todo ok 1');
    const resOk = await headerAmadeus.generateHeader();
    console.log(resOk);
    res.status(200).json(resOk);
}