/* const jwt = require('jsonwebtoken');
const hash = require('../utils/hash'); */
//const sql = require("mssql");
const requesthttp = require('request');
const qs = require('qs');
const xml2js = require('xml2js');
const builder = new xml2js.Builder();
const headerAmadeus = require('../controllers/headerAmadeus');
const deleteText = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const authentication = { url: 'https://test.api.amadeus.com/', client_id: 'RBc7Aa3hYxfErGfTuLYqyoeNU1xqFW25', client_secret: 'N0hFslmwu3zpofYQ' }; //Pruebas
let token = '';

exports.testXML = async (req, res) => {
    const response = await procesosAmadeusXML('https://www.dataaccess.com/webservicesserver/NumberConversion.wso', 'POST', req.body);
    res.status(200).json({ error: false, data: response });
}
exports.searchText1 = async (req, res) => {
    const data = req.body;
    res.end();
}
exports.searchText = async (req, res) => {
    const data = req.body;
    console.log('data: ', data);
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
exports.booking1 = async (req, res) => {
    const body = req.body;
    const resOk = await procesosAmadeusXML('POST', body.data, 'FMPTBQ_23_1_1A', 0);
    res.status(200).json({ error: false, data: resOk });
}
exports.booking2 = async (req, res) => {
    const body = req.body;
    const resOk = await procesosAmadeusXML('POST', body.data, 'TIPNRQ_23_1_1A', 1, {});
    const session = resOk['soapenv:Envelope']['soapenv:Header'][0]['awsse:Session'][0];
    /* console.log('session: ', session); */
    const body1 = { "soapenv:Body": { "Fare_CheckRules": [{ "msgType": [{ "messageFunctionDetails": [{ "messageFunction": ["712"] }] }], "itemNumber": [{ "itemNumberDetails": [{ "number": ["1"] }] }] }] } };
    const resOk1 = await procesosAmadeusXML('POST', body1, 'FARQNQ_07_1_1A', 2, { SessionId: session['awsse:SessionId'][0], sequenceNumber: 2, securityToken: session['awsse:SecurityToken'][0] });
    /* console.log('resOk1: ', resOk1); */
    const resOk2 = await procesosAmadeusXML('POST', {}, 'VLSSOQ_04_1_1A', 3, { SessionId: session['awsse:SessionId'][0], sequenceNumber: 2, securityToken: session['awsse:SecurityToken'][0] });
    /* console.log('resOk2: ', resOk2); */
    res.status(200).json({ error: false, data: resOk2 });
}
exports.booking3 = async (req, res) => {
    const resOk = await procesosAmadeusXML('POST', body.data, body.action, body.stateful);
    res.status(200).json({ error: false, data: resOk });
}
exports.booking4 = async (req, res) => {
    const resOk = await procesosAmadeusXML('POST', body.data, body.action, body.stateful);
    res.status(200).json({ error: false, data: resOk });
}
async function procesosAmadeusXML(method, body, action, type, session) {
    return new Promise(async (resolve, reject) => {
        let options = {};
        const path = 'https://nodeD1.test.webservices.amadeus.com/1ASIWWANWPS';
        const newXML = type == 3 ? `<soapenv:Body> <Security_SignOut xmlns="http://xml.amadeus.com/${action}"></Security_SignOut> </soapenv:Body>` : await json2xml(body);
        const headerOk = type < 2 ? await headerAmadeus.generateHeader(action, type) : await headerAmadeus.generateHeaderStateful(action, type, session);
        /* console.log('headerOk: ', headerOk); */
        const envelop = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sec="http://xml.amadeus.com/2010/06/Security_v1" xmlns:typ="http://xml.amadeus.com/2010/06/Types_v1" xmlns:iat="http://www.iata.org/IATA/2007/00/IATA2010.1" xmlns:app="http://xml.amadeus.com/2010/06/AppMdw_CommonTypes_v3" xmlns:link="http://wsdl.amadeus.com/2010/06/ws/Link_v1" xmlns:ses="http://xml.amadeus.com/2010/06/Session_v3">${headerOk}${newXML}</soapenv:Envelope>`;
        /* resolve(envelop); */
        /* console.log('envelop: ', envelop); */
        if (method == 'GET') {
            options = { method: method, url: path, headers: { 'content-type': 'text/xml', 'POST': 'https://nodeD1.test.webservices.amadeus.com/HTTP/1.1', 'SOAPAction': `http://webservices.amadeus.com/${action}` } };
        } else {
            options = { method: method, url: path, headers: { 'content-type': 'text/xml', 'POST': 'https://nodeD1.test.webservices.amadeus.com/HTTP/1.1', 'SOAPAction': `http://webservices.amadeus.com/${action}` }, body: envelop };
        }
        requesthttp(options, async (error, response, body) => {
            if (error) { reject({ error: true, data: error }); } else { const newJSON = await xml2json(response.body); console.log((newJSON)); resolve(newJSON); }
        })
    });
}
async function getToken() {
    return new Promise((resolve, reject) => { const body = qs.stringify({ 'grant_type': 'client_credentials', 'client_id': 'RBc7Aa3hYxfErGfTuLYqyoeNU1xqFW25', 'client_secret': 'N0hFslmwu3zpofYQ' }); const options = { method: 'post', url: authentication.url + 'v1/security/oauth2/token', headers: { 'Content-type': 'application/x-www-form-urlencoded' }, body: body, json: true }; requesthttp(options, async (error, response, body) => { if (error) { reject(false); } else { token = response.body.access_token; resolve(true); } }) });
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
async function xml2json(xml) {
    return new Promise((resolve, reject) => {
        const parser = new xml2js.Parser(); parser.parseString(xml, function (err, result) { resolve(result); });
    });
}
async function json2xml(json) {
    return new Promise((resolve, reject) => {
        resolve((builder.buildObject(json)).replace(deleteText, ''));
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
/* exports.header = async (req, res) => {
    console.log('llega todo ok 1');
    const resOk = await headerAmadeus.generateHeader(req.body.action);
    console.log(resOk);
    res.status(200).json(resOk);
} */