/* const jwt = require('jsonwebtoken');
const hash = require('../utils/hash'); */
//const sql = require("mssql");
const requesthttp = require('request');
const qs = require('qs');
const xml2js = require('xml2js');
const builder = new xml2js.Builder();
const headerAmadeus = require('../controllers/headerAmadeus');
const deleteText = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

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
    const body = req.body;
    console.log('body: ', body);
    const resOk = await procesosAmadeusXML('https://nodeD1.test.webservices.amadeus.com/1ASIWWANWPS', 'POST', body.data, body.action, body.stateful);
    /* if(body.stateful == false){
        resOk = await procesosAmadeusXML('https://nodeD1.test.webservices.amadeus.com/1ASIWWANWPS', 'POST', body.data, body.action, body.stateful);
    } else {
        resOk = 'No se puede realizar la reserva porque el estado es true'
    } */
    /* console.log(resOk); */
    res.status(200).json({ error: false, data: resOk });
}
async function procesosAmadeusXML(path, method, body, action, type) {
    return new Promise(async (resolve, reject) => {
        let options = {};
        const newXML = await json2xml(body)
        const headerOk = type == false ? await headerAmadeus.generateHeader(action) : await headerAmadeus.generateHeaderStateful(action);
        const envelop = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sec="http://xml.amadeus.com/2010/06/Security_v1" xmlns:typ="http://xml.amadeus.com/2010/06/Types_v1" xmlns:iat="http://www.iata.org/IATA/2007/00/IATA2010.1" xmlns:app="http://xml.amadeus.com/2010/06/AppMdw_CommonTypes_v3" xmlns:link="http://wsdl.amadeus.com/2010/06/ws/Link_v1" xmlns:ses="http://xml.amadeus.com/2010/06/Session_v3">${headerOk}${newXML}</soapenv:Envelope>`;
        console.log('envelop: ', envelop);
        if (method == 'GET') {
            options = { method: method, url: path, headers: { 'content-type': 'text/xml', 'POST': 'https://nodeD1.test.webservices.amadeus.com/HTTP/1.1', 'SOAPAction': `http://webservices.amadeus.com/${action}` } };
        } else {
            options = { method: method, url: path, headers: { 'content-type': 'text/xml', 'POST': 'https://nodeD1.test.webservices.amadeus.com/HTTP/1.1', 'SOAPAction': `http://webservices.amadeus.com/${action}` }, body: envelop };
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
        resolve((builder.buildObject(json)).replace(deleteText, ''));
    });
}
exports.header = async (req, res) => {
    console.log('llega todo ok 1');
    const resOk = await headerAmadeus.generateHeader(req.body.action);
    console.log(resOk);
    res.status(200).json(resOk);
}