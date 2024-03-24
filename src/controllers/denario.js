const sql = require("mssql");
const requesthttp = require('request');
const authentication1 = { url: 'https://api.denarios.com.co/api/', aut: 'AutWanderlustPro2024' }; //Producción
const authentication = { url: 'http://localhost:4370/api/', aut: 'AutWanderlustPro2024' }; //Sandbox

/* exports.credit_limit = async (req, res) => {
    const data = req.body;
    const resOk = await procesosDenario('wanderlust/consultar_cupo', 'POST', { Id: data.Id});
    resOk.status == true ? res.status(200).json({ error: false, data: resOk.body }) : res.status(400).json({ error: true, data: resOk.body });
} */
async function credit_limit (Id){
    const resOk = await procesosDenario('wanderlust/consultar_cupo', 'POST', { cedula: Id});
    return resOk;
}
module.exports.credit_limit = credit_limit;
async function procesosDenario(path, method, body) {
    return new Promise((resolve, reject) => {
        let options = {};
        if (method == 'GET') {
            options = { method: method, url: authentication.url + path, headers: { accept: 'application/json', 'content-type': 'application/json', 'Authorization': authentication.aut } };
        } else {
            options = { method: method, url: authentication.url + path, headers: { accept: 'application/json', 'content-type': 'application/json', 'Authorization': authentication.aut }, body: body, json: true };
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