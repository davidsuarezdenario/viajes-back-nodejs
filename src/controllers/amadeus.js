const sql = require("mssql"), requesthttp = require('request'), qs = require('qs'), xml2js = require('xml2js'), builder = new xml2js.Builder(), headerAmadeus = require('../controllers/headerAmadeus'), deleteText = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const authentication = { url: 'https://test.api.amadeus.com/', client_id: 'RBc7Aa3hYxfErGfTuLYqyoeNU1xqFW25', client_secret: 'N0hFslmwu3zpofYQ' }; //Pruebas
let token = '';

exports.iataCodes = async (req, res) => {
    const request = new sql.Request();
    await request.query(`SELECT * FROM IataCodesPlaces WHERE available=1`).then((object) => {
        res.status(200).json({ error: false, data: object.recordset })
    }).catch((err) => {
        res.status(400).json({ error: true, data: err });
    });
}
exports.Fare_MasterPricerTravelBoardSearch = async (req, res) => {
    const body = req.body;
    console.log('Fare_MasterPricerTravelBoardSearch');
    const resOk = await procesosAmadeusXML('POST', body.data, 'FMPTBQ_23_1_1A', 0, {});
    res.status(200).json({ error: false, data: resOk.newJSON, session: {} });
}
exports.Fare_InformativePricingWithoutPNR = async (req, res) => {
    const body = req.body;
    console.log('Fare_MasterPricerTravelBoardSearch: ', body);
    const resOk = await procesosAmadeusXML('POST', body.data, 'TIPNRQ_23_1_1A', 1, {});
    res.status(200).json({ error: false, data: resOk.newJSON, session: resOk.dataOut });
}
exports.Air_SellFromRecommendation = async (req, res) => {
    const body = req.body;
    console.log('Air_SellFromRecommendation: ', body);
    const resOk = await procesosAmadeusXML('POST', body.data, 'ITAREQ_05_2_IA', 2, body.session);
    res.status(200).json({ error: false, data: resOk.newJSON, session: resOk.dataOut });
}
exports.PNR_AddMultiElements = async (req, res) => {
    const body = req.body;
    const resOk = await procesosAmadeusXML('POST', body.data, 'PNRADD_21_1_1A', 0, {});
    res.status(200).json({ error: false, data: resOk.newJSON, session: resOk.dataOut });
}
exports.FOP_CreateFormOfPayment = async (req, res) => {
    const body = req.body;
    const resOk = await procesosAmadeusXML('POST', body.data, 'TFOPCQ_19_2_1A', 0, {});
    res.status(200).json({ error: false, data: resOk.newJSON, session: resOk.dataOut });
}
exports.Fare_PricePNRWithBookingClass = async (req, res) => {
    const body = req.body;
    const resOk = await procesosAmadeusXML('POST', body.data, 'TPCBRQ_23_2_1A', 0, {});
    res.status(200).json({ error: false, data: resOk.newJSON, session: resOk.dataOut });
}
exports.Ticket_CreateTSTFromPricing = async (req, res) => {
    const body = req.body;
    const resOk = await procesosAmadeusXML('POST', body.data, 'TAUTCQ_04_1_1A', 0, {});
    res.status(200).json({ error: false, data: resOk.newJSON, session: resOk.dataOut });
}
exports.Security_SignOut = async (req, res) => {
    const body = req.body;
    const resOk = await procesosAmadeusXML('POST', body.data, 'VLSSOQ_04_1_1A', 3, {});
    res.status(200).json({ error: false, data: resOk.newJSON, session: resOk.dataOut });
}
//Funciones globales
async function procesosAmadeusXML(method, body, action, type, session) {
    return new Promise(async (resolve, reject) => {
        let options = {};
        const path = 'https://nodeD1.test.webservices.amadeus.com/1ASIWWANWPS';
        const newXML = type == 3 ? `<soapenv:Body> <Security_SignOut xmlns="http://xml.amadeus.com/${action}"></Security_SignOut> </soapenv:Body>` : await json2xml(body);
        const headerOk = type < 2 ? await headerAmadeus.generateHeader(action, type) : await headerAmadeus.generateHeaderStateful(action, type, session);
        /* console.log('headerOk: ', headerOk); */
        const envelop = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sec="http://xml.amadeus.com/2010/06/Security_v1" xmlns:typ="http://xml.amadeus.com/2010/06/Types_v1" xmlns:iat="http://www.iata.org/IATA/2007/00/IATA2010.1" xmlns:app="http://xml.amadeus.com/2010/06/AppMdw_CommonTypes_v3" xmlns:link="http://wsdl.amadeus.com/2010/06/ws/Link_v1" xmlns:ses="http://xml.amadeus.com/2010/06/Session_v3">${headerOk.header}${newXML}</soapenv:Envelope>`;
        /* resolve(envelop); */
        /* console.log('envelop: ', envelop); */
        if (method == 'GET') {
            options = { method: method, url: path, headers: { 'content-type': 'text/xml', 'POST': 'https://nodeD1.test.webservices.amadeus.com/HTTP/1.1', 'SOAPAction': `http://webservices.amadeus.com/${action}` } };
        } else {
            options = { method: method, url: path, headers: { 'content-type': 'text/xml', 'POST': 'https://nodeD1.test.webservices.amadeus.com/HTTP/1.1', 'SOAPAction': `http://webservices.amadeus.com/${action}` }, body: envelop };
        }
        requesthttp(options, async (error, response, body) => {
            if (error) { 
                reject({ error: true, data: error }); 
            } else { 
                console.log(response.body);
                const newJSON = await xml2json(response.body); 
                /* console.log(newJSON); */
                headerOk.dataOut.securityToken = newJSON['soapenv:Envelope']['soapenv:Header'][0]['awsse:Session'][0]['awsse:SecurityToken'][0]; headerOk.dataOut.sequenceNumber = newJSON['soapenv:Envelope']['soapenv:Header'][0]['awsse:Session'][0]['awsse:SequenceNumber'][0]; headerOk.dataOut.sessionId = newJSON['soapenv:Envelope']['soapenv:Header'][0]['awsse:Session'][0]['awsse:SessionId'][0]; headerOk.dataOut.transaction = newJSON['soapenv:Envelope']['soapenv:Header'][0]['awsse:Session'][0]['$'].TransactionStatusCode;
                console.log('headerOk: ', headerOk.dataOut);
                resolve({ newJSON: newJSON, dataOut: headerOk.dataOut }); 
            }
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