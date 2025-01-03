const jwt = require('jsonwebtoken');
const sql = require("mssql");
const hash = require('../utils/hash');

exports.sesion = async (req, res) => {
    res.status(200).json({
        Error: false,
        Message: 'Sesión activa'
    });
};

exports.login = async (req, res) => {
    const { username, password } = req.body, request = new sql.Request();
    const sql_str = `SELECT Pass, Documento FROM UsersLogin WHERE En=1 AND (Documento='${username}' OR Email='${username}' OR Phone='${username}')`;
    request.query(sql_str).then((object) => {
        verifLogin(object.recordset[0], res, username, password);
    }).catch((err) => {
        console.log('login: ', err);
    });
};

exports.register = async (req, res) => {
    const data = req.body, request = new sql.Request();
    const sql_srt1 = `SELECT Existe=(SELECT COUNT(*) FROM UsersData WHERE Documento='${data.Documento}') + (SELECT COUNT(*) FROM UsersLogin WHERE Documento='${data.Documento}')`;
    const resp_1 = await request.query(sql_srt1);
    if(resp_1.recordset[0]?.Existe > 0){
        res.status(400).send({ Status: false, Message: 'Usuario ya existe' });
    } else {
        const sql_str2 = `INSERT INTO UsersData VALUES ('${data.document}','${data.name}','${data.lastname}',null,null)
        INSERT INTO UsersLogin VALUES ('${data.document}','${data.email}','${data.phone}','${await hash.hashPassword(data.pass1)}',GETDATE(),null,1)`;
        request.query(sql_srt1).then((object) => {
            console.log('object: ', object);
            res.status(200).send({ Status: true, Message: 'ok', Data: data });
        }).catch((err) => {
            res.status(400).send({ Status: false, Message: err });
        });
    }
    /* console.log('resp_1: ', resp_1.recordset[0].Existe);
    console.log('data: ', data);
    console.log('sql_srt1: ', sql_srt1); */
    /* 
    request.query(sql_str).then((object) => {
        verifLogin(object.recordset[0], res, username, password);
    }).catch((err) => {
        console.log('login: ', err);
    }); */
};

async function verifLogin(resSql, resApi, username, password) {
    console.log('verifLogin: ', resSql);
    if (!resSql) {
        resApi.status(401).send({ Error: true, Message: 'Usuario no encontrado' });
    } else {
        if (await hash.comparePassword(password, resSql.Pass)) {
            const token = jwt.sign({ username: resSql.username }, process.env.JWT_SECRET, { expiresIn: '5d' });
            const updateLoginResponse = await updateLogin(username);
            if (updateLoginResponse.Error) {
                console.log('updateLoginResponse: ', updateLoginResponse);
                resApi.status(401).send({ Error: true, Message: updateLoginResponse });
            } else {
                resApi.status(200).json({ Error: false, Token: token, Documento: resSql.Documento });
            }
        } else {
            resApi.status(401).send({ Error: true, Message: 'Contraseña incorrecta' });
        }
    }
}

async function updateLogin(username) {
    let response;
    const request = new sql.Request();
    const sql_str = `UPDATE UsersLogin SET UpdateDate=GETDATE() WHERE Documento='${username}' OR Email='${username}' OR Phone='${username}'`;
    await request.query(sql_str).then((object) => {
        response = { Error: false, Message: 'Login actualizado correctamente' }
    }).catch((err) => {
        response = { Error: true, Message: err }
    });
    console.log('updateLogin: ', response);
    return response;
}