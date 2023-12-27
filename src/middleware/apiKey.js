const sql = require("mssql");

const verificarApiKey = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        return res.status(401).json({ error: 'API Key es requerida' });
    }

    const verifApiKeyDBresponse = await verifApiKeyDB(apiKey);

    if (verifApiKeyDBresponse) {
        next();
    } else {
        res.status(400).json({ error: 'No tiene autorización' });
    }
};

async function verifApiKeyDB(apiKey) {
   let response = false; 
   const request = new sql.Request();
   sql_str = `SELECT ApiKey FROM ApiKeys WHERE ApiKey='${apiKey}' AND En=1`;
   await request.query(sql_str)
        .then((object) => {
            if(object.recordset[0]){
                response = true;
            }
        })
        .catch((err) => {
            console.log('verifApiKeyDB: ',err);
        });
    return response;
}

module.exports = verificarApiKey;