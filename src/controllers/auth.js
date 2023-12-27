const jwt = require('jsonwebtoken');
const sql = require("mssql");
const hash = require('../utils/hash');

exports.login = async (req, res) => {
    const { username, password } = req.body;
    const request = new sql.Request();
    sql_str = `SELECT Pass, Documento FROM UsersLogin WHERE En=1 AND (Documento='${username}' OR Email='${username}' OR Phone='${username}')`;
    request.query(sql_str)
        .then((object) => {
            verifLogin(object.recordset[0],res,username,password);
        })
        .catch((err) => {
            console.log('login: ',err);
        });
};

async function verifLogin(resSql,resApi,username,password){
    console.log('verifLogin: ',resSql);
    if(!resSql){
        resApi.status(401).send({ Error: true, Message: 'Usuario no encontrado' });
    }else{
        if(await hash.comparePassword(password, resSql.Pass)){
            const token = jwt.sign({ username: resSql.username }, process.env.JWT_SECRET, { expiresIn: '5d' });
            const updateLoginResponse = await updateLogin(username);
            if(updateLoginResponse.Error){
                console.log('updateLoginResponse: ',updateLoginResponse);
                resApi.status(401).send(updateLoginResponse);
            }else{
                resApi.status(200).json({
                    Token: token,
                    Documento: resSql.Documento
                });
            }
        }else{
            resApi.status(401).send({ Error: true, Message: 'Contraseña incorrecta' });
        }
    }
}

async function updateLogin(username){
    let response;
    const request = new sql.Request();
    sql_str = `UPDATE UsersLogin SET UpdateDate=GETDATE() WHERE Documento='${username}' OR Email='${username}' OR Phone='${username}'`;
    await request.query(sql_str)
        .then((object) => {
            response = { 
                Error: false,
                Message: 'Login actualizado correctamente'
            }
        })
        .catch((err) => {
            response = { 
                Error: true,
                Message: err
            }
        });
    console.log('updateLogin: ',response);
    return response;
}