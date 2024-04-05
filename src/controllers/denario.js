const sql = require("mssql");
const requesthttp = require('request');
const authentication1 = { url: 'https://api.denarios.com.co/api/', aut: 'AutWanderlustPro2024' }; //Producción
const authentication = { url: 'http://localhost:4370/api/', aut: 'AutWanderlustPro2024' }; //Sandbox

/* exports.credit_limit = async (req, res) => {
    const data = req.body;
    const resOk = await procesosDenario('wanderlust/consultar_cupo', 'POST', { Id: data.Id});
    resOk.status == true ? res.status(200).json({ error: false, data: resOk.body }) : res.status(400).json({ error: true, data: resOk.body });
} */
exports.simulateCredit = async (req, res) => {
    const data = req.body;
    const resOk = await procesosDenario('wanderlust/simular_solicitud', 'POST', { cedula: data.Document, monto: data.Amount });
    resOk.status == true ? res.status(200).json({ error: false, data: resOk.body }) : res.status(400).json({ error: true, data: resOk.body });
}
exports.saveCredit = async (req, res) => {
    const data = req.body;
    const resOk = await procesosDenario('wanderlust/aprobar_solicitud', 'POST', { cedula: data.Document, monto: data.Amount, plazo: data.Term });
    resOk.status == true ? res.status(200).json({ error: false, body: resOk.body, detail: resOk.det }) : res.status(400).json({ error: true, data: resOk.body });
}
exports.endPayment = async (req, res) => {
    const data = req.body;
    const resOk = await procesosDenario('wanderlust/confirma_solicitud', 'POST', { cedula: data.Document, numSol: data.NumSol, credito: data.Credit, denarios: data.Points, bookingId: data.Id });
    resOk.status == true ? res.status(200).json({ error: false, body: resOk.body }) : res.status(200).json({ error: true, data: resOk.body });
}
exports.validateCodePhone = async (req, res) => {
    const data = req.body;
    const resOk = await procesosDenario('wanderlust/verificar_cod_sms', 'POST', { cedula: data.Document, token: data.Code });
    resOk.status == true ? res.status(200).json({ error: false }) : res.status(200).json({ error: true });
}
exports.validateCodeEmail = async (req, res) => {
    const data = req.body;
    const resOk = await procesosDenario('wanderlust/verificar_cod_email', 'POST', { cedula: data.Document, numSol: data.NumSol, token: data.Code });
    resOk.status == 1 ? res.status(200).json({ error: false }) : res.status(200).json({ error: true });
}
exports.askCodePhone = async (req, res) => {
    const data = req.body;
    const resOk = await procesosDenario('wanderlust/solicitar_cod_sms', 'POST', { cedula: data.Document });
    resOk.success == true ? res.status(200).json({ error: false }) : res.status(400).json({ error: true });
}
exports.askCodeEmail = async (req, res) => {
    const data = req.body;
    const resOk = await procesosDenario('wanderlust/solicitar_cod_email', 'POST', { cedula: data.Document, numSol: data.NumSol });
    resOk.success == true ? res.status(200).json({ error: false }) : res.status(400).json({ error: true });
}
async function creditLimit(Id) {
    const resOk = await procesosDenario('wanderlust/consultar_cupo', 'POST', { cedula: Id });
    return resOk;
}
module.exports.creditLimit = creditLimit;
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