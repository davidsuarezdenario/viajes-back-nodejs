/* const jwt = require('jsonwebtoken');
const sql = require("mssql");
const hash = require('../utils/hash'); */
const requesthttp = require('request');
const authentication = { url: 'https://api.tequila.kiwi.com/', apikey: 'WD46QV90IhTg_UnVxzMcRuFO80K3W7wy' }; //Producción

exports.search = async (req, res) => {
    console.log('req.body: ', req.body);
    if (req.body.search != '' && req.body.search != undefined) {
        const search = `locations/query?term=${req.body.search}&locale=es-CO&location_types=airport&limit=10&active_online=true`;
        const resOk = await procesosTravelDenario(search, 'GET', {});
        res.status(200).json({ success: false, data: JSON.parse(resOk) });
    } else {
        res.status(200).json({ success: true, data: 'No se recibe texto' });
    }
};
exports.getListaCuentas = async (req, res) => {
    let resOk = await procesosDruo(`${url_druo}accounts/list`, 'GET', {});
    if (JSON.parse(resOk).message == 'Unauthorized') {
        await renovarTokenOk();
        resOk = await procesosDruo(`${url_druo}accounts/list`, 'GET', {});
    }
    if (resOk.error) {
        res.status(200).json({ success: false });
    } else {
        res.status(200).json({ success: true, data: JSON.parse(resOk) });
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