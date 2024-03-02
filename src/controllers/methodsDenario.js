/* const jwt = require('jsonwebtoken');
const sql = require("mssql");
const hash = require('../utils/hash'); */
const requesthttp = require('request');
const authentication = { url: 'https://api.denario.com.co/api/', aut: 'AutDenarioPro2021', autApp: 'AutDenarioApp2021' }; //Producción

exports.get_cupo = async (req, res) => {
    const data = req.body;
    const resOk = await procesosDenario('quantum/consultar_cupo', 'POST', { Authorization: authentication.aut }, { cedula: data.id });
    res.status(200).json(resOk);

    /* if (data.search != '' && data.search != undefined) {
        let pathConsulta = `locations/query?term=${data.search}&limit=${data.limit}&locale=es-ES&active_online=true`;
        if (data.location_types) { for (dato of data.location_types) { pathConsulta += `&location_types=${dato}`; } } else { pathConsulta += `&location_types=airport`; }
        res.status(200).json({ error: false, data: JSON.parse(resOk) });
    } else {
        res.status(400).json({ error: true, data: 'No se recibe texto' });
    } */
}

async function procesosDenario(path, method, headers, body) {
    return new Promise((resolve, reject) => {
        let options = {}; let header = { accept: 'application/json', 'content-type': 'application/json' };
        Object.assign(header, headers);
        if (method == 'GET') {
            options = { method: method, url: authentication.url + path, headers: header };
        } else {
            options = { method: method, url: authentication.url + path, headers: header, body: body, json: true };
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