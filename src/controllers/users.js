const sql = require("mssql");

exports.initData = async (req, res) => {
    const idCliente = req.body.idCliente;
    const request = new sql.Request();
    sql_str = `SELECT * FROM vw_UsersData WHERE En=1 AND Documento='${idCliente}'`;
    request.query(sql_str)
        .then((object) => {
            res.status(200).json({
                Error: false,
                Data: object.recordset[0]
            });
        })
        .catch((err) => {
            console.log('initData: ',err);
            res.status(400).json({
                Error: true,
                Message: err
            });
        });
}